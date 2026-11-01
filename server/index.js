import http from 'node:http';
import net from 'node:net';
import {mkdir,readFile,writeFile,unlink,realpath} from 'node:fs/promises';
import {createReadStream,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {validateGame} from '../src/domain.js';
import {HttpError,digest,equal,hashPassword,verifyPassword,validatePassword,loadVault,headers} from './security.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dev=process.argv.includes('--dev'),port=Number(process.env.PORT||5173),host=process.env.HOST||'127.0.0.1';
// The workspace account server must remain on loopback. Public hosting uses managed Auth and RLS.
if(!['127.0.0.1','::1','localhost'].includes(host))throw new Error('Local accounts cannot be exposed to the network. Use the cloud deployment.');
// Refuse a duplicate process before opening or migrating the live database.
await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',()=>reject(new Error('Stop the previous Sensou server before starting this one.')));probe.listen(port,host,()=>probe.close(resolve));});
const dataDir=process.env.DATA_DIR||path.join(root,'data');
await mkdir(dataDir,{recursive:true,mode:0o700});
const db=new DatabaseSync(path.join(dataDir,'sensou.sqlite'));
db.exec(`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;PRAGMA secure_delete=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS games(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,payload TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS games_user ON games(user_id);
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS security_meta(version INTEGER PRIMARY KEY);`);
const migrated=Boolean(db.prepare('SELECT 1 FROM security_meta WHERE version=1').get());
const vault=await loadVault(process.env.SECURITY_KEY_FILE||path.join(root,'.local-secrets','master.key'),{mustExist:migrated});
const profile=user=>JSON.parse(vault.open(user.name,`profile:${user.id}`));
if(migrated){const first=db.prepare('SELECT * FROM users LIMIT 1').get();if(first)try{profile(first);}catch{throw new Error('Existing data cannot be decrypted. Restore the original encryption key.');}}
if(!migrated){
  const temporary=path.join(dataDir,`migration-${randomUUID()}.sqlite`);
  db.prepare('VACUUM INTO ?').run(temporary);
  try{await writeFile(path.join(dataDir,`pre-security-${randomUUID()}.enc`),vault.seal(await readFile(temporary),'database-backup'),{flag:'wx',mode:0o600});}finally{await unlink(temporary);}
  db.exec('BEGIN IMMEDIATE');
  try{
    db.exec(`ALTER TABLE sessions ADD COLUMN last_seen INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE sessions ADD COLUMN created INTEGER NOT NULL DEFAULT 0;`);
    for(const u of db.prepare('SELECT * FROM users').all())db.prepare('UPDATE users SET email=?,name=? WHERE id=?').run(vault.lookup(u.email),vault.seal(JSON.stringify({email:u.email,name:u.name}),`profile:${u.id}`),u.id);
    for(const row of db.prepare('SELECT id,payload FROM games').all()){const g=JSON.parse(row.payload);g.notes=vault.seal(g.notes||'',`notes:${row.id}`);db.prepare('UPDATE games SET payload=? WHERE id=?').run(JSON.stringify(g),row.id);}
    db.exec('DELETE FROM sessions;DELETE FROM rate_limits;INSERT INTO security_meta VALUES(1);COMMIT;PRAGMA wal_checkpoint(TRUNCATE);VACUUM;');
  }catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e;}
}
const IDLE=1800000,ABSOLUTE=43200000;
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','Pragma':'no-cache'});res.end(JSON.stringify(value));};
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split('=')).filter(p=>p.length===2));
const cookie=(name,value,maxAge)=>`${name}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
function limit(key,max,window=900000){
  const now=Date.now(),hash=digest(key);db.prepare('DELETE FROM rate_limits WHERE expires<?').run(now);
  db.prepare('INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(hash,now+window);
  if(db.prepare('SELECT count FROM rate_limits WHERE key=?').get(hash).count>max)throw new HttpError(429,'Too many attempts. Please try again later.','RATE_LIMIT');
}
function session(req){
  const raw=cookies(req).sensou_session;if(!/^[a-f0-9]{64}$/.test(raw||''))return null;
  const u=db.prepare('SELECT users.*,sessions.token,sessions.expires,sessions.last_seen,sessions.created FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=?').get(digest(raw));
  if(!u)return null;const now=Date.now();
  if(u.expires<now||now-u.last_seen>IDLE||now-u.created>ABSOLUTE){db.prepare('DELETE FROM sessions WHERE token=?').run(u.token);return null;}
  db.prepare('UPDATE sessions SET last_seen=? WHERE token=?').run(now,u.token);return u;
}
const publicUser=u=>({id:u.id,...profile(u)});
function requireUser(u){if(!u)throw new HttpError(401,'Please sign in.','SIGN_IN_REQUIRED');}
function newSession(req,res,id){
  const old=cookies(req).sensou_session;if(old)db.prepare('DELETE FROM sessions WHERE token=?').run(digest(old));
  db.prepare('DELETE FROM sessions WHERE expires<? OR last_seen<?').run(Date.now(),Date.now()-IDLE);
  const token=randomBytes(32).toString('hex'),now=Date.now();
  db.prepare('INSERT INTO sessions(token,user_id,expires,last_seen,created) VALUES(?,?,?,?,?)').run(digest(token),id,now+ABSOLUTE,now,now);
  res.setHeader('Set-Cookie',cookie('sensou_session',token,ABSOLUTE/1000));
}
async function body(req){
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new HttpError(415,'JSON required.');
  if(Number(req.headers['content-length'])>8192)throw new HttpError(413,'Request too large.');
  let bytes=0;const chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>8192)throw new HttpError(413,'Request too large.');chunks.push(chunk);}
  let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'Invalid JSON.');}
  if(!input||typeof input!=='object'||Array.isArray(input))throw new HttpError(400,'Expected a JSON object.');return input;
}
async function api(req,res,url){
  limit(`requests:${req.socket.remoteAddress}`,500,60000);
  if(req.method!=='GET'&&req.method!=='HEAD'){
    if(req.headers.origin!==`http://${req.headers.host}`||req.headers['sec-fetch-site']==='cross-site')throw new HttpError(403,'Request origin rejected.');
    const token=req.headers['x-csrf-token'];if(!equal(token,cookies(req).sensou_csrf)||!vault.validCsrf(token))throw new HttpError(403,'Refresh the form and try again.','CSRF_INVALID');
  }
  const u=session(req);
  if(url.pathname==='/api/auth/csrf'&&req.method==='GET'){const token=vault.csrf();res.setHeader('Set-Cookie',cookie('sensou_csrf',token,3600));return send(res,200,{token});}
  if(url.pathname==='/api/auth/me'&&req.method==='GET')return send(res,200,{user:u?publicUser(u):null});
  if(['/api/auth/register','/api/auth/login'].includes(url.pathname)&&req.method==='POST'){
    limit(`auth:${req.socket.remoteAddress}`,30);const input=await body(req);
    if(typeof input.email!=='string'||typeof input.password!=='string'||input.password.length>128)throw new HttpError(400,'Enter your email and password.');
    const email=input.email.trim().toLowerCase();if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new HttpError(400,'Enter a valid email.');
    const lookup=vault.lookup(email);limit(`email:${lookup}`,12);let account=db.prepare('SELECT * FROM users WHERE email=?').get(lookup);
    if(url.pathname.endsWith('register')){
      validatePassword(input.password);if(typeof input.name!=='string'||input.name.trim().length<2||input.name.trim().length>40)throw new HttpError(400,'Use a player name of 2–40 characters.');
      const hash=await hashPassword(input.password);
      if(account)return send(res,200,{message:'If this address is available, registration can continue. Otherwise sign in or use account recovery.'});
      const id=randomUUID(),name=vault.seal(JSON.stringify({email,name:input.name.trim()}),`profile:${id}`);
      db.prepare('INSERT INTO users(id,email,name,password) VALUES(?,?,?,?)').run(id,lookup,name,hash);account=db.prepare('SELECT * FROM users WHERE id=?').get(id);
    }else{
      const checked=await verifyPassword(input.password,account?.password);if(!account||!checked.valid)throw new HttpError(401,'Email or password is incorrect.','LOGIN_FAILED');
      if(checked.needsUpgrade)db.prepare('UPDATE users SET password=? WHERE id=?').run(await hashPassword(input.password),account.id);
    }
    newSession(req,res,account.id);return send(res,200,{user:publicUser(account)});
  }
  if(['/api/auth/logout','/api/auth/logout-all'].includes(url.pathname)&&req.method==='POST'){
    if(url.pathname.endsWith('logout-all')){requireUser(u);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);}else if(u)db.prepare('DELETE FROM sessions WHERE token=?').run(u.token);
    res.setHeader('Set-Cookie',cookie('sensou_session','',0));return send(res,200,{ok:true});
  }
  if(url.pathname==='/api/auth/password'&&req.method==='POST'){
    requireUser(u);limit(`password:${u.id}`,5);const input=await body(req);validatePassword(input.password);
    if(typeof input.currentPassword!=='string'||input.currentPassword.length>128||!(await verifyPassword(input.currentPassword,u.password)).valid)throw new HttpError(401,'Current password is incorrect.');
    db.prepare('UPDATE users SET password=? WHERE id=?').run(await hashPassword(input.password),u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);
    res.setHeader('Set-Cookie',cookie('sensou_session','',0));return send(res,200,{ok:true});
  }
  if(url.pathname==='/api/games'&&req.method==='GET'){
    const mine=url.searchParams.get('mine')==='1';if(mine)requireUser(u);
    const rows=mine?db.prepare('SELECT id,payload FROM games WHERE user_id=? ORDER BY created_at DESC').all(u.id):db.prepare('SELECT id,payload FROM games ORDER BY created_at DESC').all();
    return send(res,200,{games:rows.map(row=>{const g={...JSON.parse(row.payload),id:row.id};if(mine)g.notes=vault.open(g.notes,`notes:${row.id}`);else delete g.notes;return g;})});
  }
  if(url.pathname==='/api/games'&&req.method==='POST'){
    requireUser(u);limit(`games:${u.id}`,40);let game;try{game=validateGame(await body(req));}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,e.message);}
    const rows=db.prepare('SELECT id,payload FROM games WHERE user_id=?').all(u.id);
    if(rows.some(row=>{const g=JSON.parse(row.payload);g.notes=vault.open(g.notes,`notes:${row.id}`);return JSON.stringify(g)===JSON.stringify(game);}))throw new HttpError(409,'You have already reported this game.');
    const id=randomUUID(),stored={...game,notes:vault.seal(game.notes,`notes:${id}`)};db.prepare('INSERT INTO games VALUES(?,?,?,?)').run(id,u.id,JSON.stringify(stored),new Date().toISOString());return send(res,201,{game:{...game,id}});
  }
  if(/^\/api\/games\/[a-f0-9-]{36}$/.test(url.pathname)&&req.method==='DELETE'){
    requireUser(u);if(!db.prepare('DELETE FROM games WHERE id=? AND user_id=?').run(url.pathname.split('/').at(-1),u.id).changes)throw new HttpError(404,'Game not found.');return send(res,200,{ok:true});
  }
  throw new HttpError(404,'API route not found.');
}
const denied=['**/data/**','**/.local-secrets/**','**/*.sqlite*','**/*.key','**/*.pem','**/*.crt','**/.env*','**/.git/**','**/.aws/**','**/.codex/**','**/.agents/**','**/server/**'];
const vite=dev?await(await import('vite')).createServer({root,server:{middlewareMode:true,fs:{deny:denied}},appType:'spa'}):null;
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.woff':'font/woff','.woff2':'font/woff2'};
const staticPolicy=!dev&&existsSync(path.join(root,'dist','_headers'))?(await readFile(path.join(root,'dist','_headers'),'utf8')).match(/^  Content-Security-Policy: (.+)$/m)?.[1]:null;
const server=http.createServer(async(req,res)=>{
  for(const [key,value]of Object.entries(headers({dev})))res.setHeader(key,value);res.setHeader('Cache-Control','no-store');
  if(staticPolicy)res.setHeader('Content-Security-Policy',staticPolicy);
  try{
    if(!new Set([`localhost:${port}`,`127.0.0.1:${port}`,`[::1]:${port}`]).has(req.headers.host))throw new HttpError(421,'Host rejected.');
    const url=new URL(req.url,'http://localhost');let decoded=url.pathname;for(let i=0;i<3;i++)decoded=decodeURIComponent(decoded);
    if(decoded.includes('\\')||decoded.includes('\0')||/(?:^|\/)(?:data|server|supabase|\.local-secrets|\.env[^/]*|\.git)(?:\/|$)/i.test(decoded)||/\.(?:sqlite[^/]*|key)(?:\/|$)/i.test(decoded))throw new HttpError(404,'Not found.');
    if(url.pathname.startsWith('/api/'))return await api(req,res,url);if(vite)return vite.middlewares(req,res,()=>{res.writeHead(404);res.end();});
    if(!['GET','HEAD'].includes(req.method))throw new HttpError(405,'Method not allowed.');
    const base=path.join(root,'dist'),file=path.resolve(base,`.${decoded}`);if(!file.startsWith(base+path.sep)&&file!==base)throw new HttpError(404,'Not found.');
    const target=path.extname(file)?file:path.join(base,'index.html');if(!existsSync(target)||!(await realpath(target)).startsWith(await realpath(base)+path.sep))throw new HttpError(404,'Not found.');
    res.writeHead(200,{'Content-Type':types[path.extname(target)]??'application/octet-stream','Cache-Control':target.includes(`${path.sep}assets${path.sep}`)?'public,max-age=31536000,immutable':'no-store'});
    if(req.method==='HEAD')return res.end();createReadStream(target).on('error',()=>res.destroy()).pipe(res);
  }catch(e){if(!res.headersSent)send(res,e instanceof HttpError?e.status:500,{error:e instanceof HttpError?e.message:'The request could not be completed.',code:e instanceof HttpError?e.code:'SERVER_ERROR'});else res.end();}
});
server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.maxHeadersCount=50;
server.listen(port,host,()=>console.log(`Sensou ready → http://localhost:${port} (${dev?'development':'production'})`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'This port is already in use. Stop the previous Sensou server first.':'Unable to start Sensou.');db.close();process.exitCode=1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await vite?.close();server.close(()=>{db.close();process.exit(0);});});
