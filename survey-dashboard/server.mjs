import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {dpapi} from './credentials.mjs';
import {parseCsv,normalizeRows} from './analysis.mjs';
import {reviewedPublicTexts} from './public-texts.mjs';
import {downloadTally,FORM_ID} from './tally.mjs';

const root=fileURLToPath(new URL('.',import.meta.url)),privateDir=path.join(root,'private');
await mkdir(privateDir,{recursive:true,mode:0o700});
const port=Number(process.env.SURVEY_PORT||5174), dev=process.argv.includes('--dev');
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('SURVEY_PORT must be between 1024 and 65535.');
const csrf=randomBytes(32).toString('hex');
async function readJson(name,fallback){try{return JSON.parse(await readFile(path.join(privateDir,name),'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw new Error(`Local file ${name} is damaged; please restore it from a backup.`);}}
async function atomic(name,value){const file=path.join(privateDir,name);await writeFile(file+'.tmp',JSON.stringify(value),{mode:0o600});await rename(file+'.tmp',file);}
let settings=await readJson('connection.json',{intervalMinutes:5}), token=process.env.TALLY_API_KEY||'';
if(!token&&settings.protectedToken&&process.platform==='win32')token=await dpapi(settings.protectedToken,true);
let cache=await readJson('responses.json',{formId:FORM_ID,records:[],source:'none',syncedAt:null,duplicates:0});
if(cache.formId!==FORM_ID)throw new Error('The local cache belongs to a different survey.');
let syncing=false,error=null,lastAttempt=null,timer=null;
async function synchronize(candidate=token){
  if(syncing)throw new Error('A sync is already running.');
  if(!candidate)throw new Error('Please connect a Tally API key first.');
  syncing=true;error=null;lastAttempt=new Date().toISOString();
  try{const next=await downloadTally(candidate,{onRaw:raw=>atomic('tally-raw.json',raw)});await atomic('responses.json',next);cache=next;return next;}
  catch(e){error=e.message;throw e;}finally{syncing=false;}
}
function schedule(){clearInterval(timer);if(token){timer=setInterval(()=>synchronize().catch(()=>{}),settings.intervalMinutes*60000);timer.unref();}}
schedule();if(token)synchronize().catch(()=>{});

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':`default-src 'self'; script-src 'self'${dev?" 'unsafe-inline'":''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${dev?'ws://127.0.0.1:'+port+' ws://localhost:'+port:''}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`};
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});res.end(JSON.stringify(value));};
async function input(req){
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw Object.assign(new Error('Expected JSON.'),{status:415});
  let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>12*1024*1024)throw Object.assign(new Error('The file is too large (12 MB maximum).'),{status:413});chunks.push(chunk);}
  try{const v=JSON.parse(Buffer.concat(chunks).toString());if(!v||typeof v!=='object'||Array.isArray(v))throw 0;return v;}catch{throw Object.assign(new Error('Invalid input.'),{status:400});}
}
function validCsrf(value){if(typeof value!=='string')return false;const candidate=Buffer.from(value),expected=Buffer.from(csrf);return candidate.length===expected.length&&timingSafeEqual(candidate,expected);}
const vite=dev?await (await import('vite')).createServer({configFile:false,root,plugins:[(await import('@vitejs/plugin-react')).default()],server:{middlewareMode:true,hmr:false,fs:{allow:[path.resolve(root,'..')],deny:['**/.env*','**/private/**','**/.local-secrets/**','**/data/**','**/*.sqlite*']}},appType:'spa'}):null;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  try{
    if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)||req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Local access only.'});
    const url=new URL(req.url,`http://${req.headers.host}`);
    if(req.method!=='GET'&&req.method!=='HEAD'&&(req.headers.origin!==url.origin||!validCsrf(req.headers['x-survey-csrf'])))return json(res,403,{error:'Request rejected. Please reload the dashboard.'});
    if(url.pathname==='/api/public-texts'&&req.method==='GET')return json(res,200,reviewedPublicTexts(cache,await readJson('public-text-review.json',{schema:1,entries:{},reviewedAt:null})));
    if(url.pathname==='/api/state'&&req.method==='GET')return json(res,200,{...cache,connected:Boolean(token),intervalMinutes:settings.intervalMinutes,syncing,error,lastAttempt,csrf,keyStorage:process.platform==='win32'?'Windows DPAPI':'Session',formId:FORM_ID});
    if(url.pathname==='/api/sync'&&req.method==='POST'){await synchronize();return json(res,200,{ok:true});}
    if(url.pathname==='/api/connect'&&req.method==='POST'){
      const body=await input(req), candidate=String(body.token||'').trim();
      if(!/^tly-\S{10,1000}$/.test(candidate))return json(res,400,{error:'Please enter a valid Tally API key (tly-…).'});
      await synchronize(candidate);
      const next={intervalMinutes:settings.intervalMinutes};
      if(process.platform==='win32')next.protectedToken=await dpapi(candidate);
      await atomic('connection.json',next);settings=next;token=candidate;schedule();return json(res,200,{ok:true});
    }
    if(url.pathname==='/api/interval'&&req.method==='POST'){
      const body=await input(req);if(![1,5,15,30].includes(body.minutes))return json(res,400,{error:'Invalid update interval.'});
      const next={...settings,intervalMinutes:body.minutes};await atomic('connection.json',next);settings=next;schedule();return json(res,200,{ok:true});
    }
    if(url.pathname==='/api/import'&&req.method==='POST'){
      if(syncing)return json(res,409,{error:'Please wait for the current sync to finish.'});
      const body=await input(req);if(body.formId!==FORM_ID||/pretest/i.test(body.filename||''))return json(res,400,{error:'Please confirm the main survey, 2jEY7L. Pretest data stays separate.'});
      const next={...normalizeRows(parseCsv(body.csv)),formId:FORM_ID,source:'csv',syncedAt:new Date().toISOString()};await atomic('responses.json',next);cache=next;error=null;return json(res,200,{ok:true,count:next.records.length});
    }
    if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Not found.'});
    if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed.'});
    if(/(?:^|\/)(?:private|\.local-secrets|data)(?:\/|$)|\.env/i.test(url.pathname))return json(res,404,{error:'Not found.'});
    for(const [key,value] of Object.entries(headers))res.setHeader(key,value);
    if(vite)return vite.middlewares(req,res,()=>json(res,404,{error:'Not found.'}));
    const file=path.resolve(root,'dist','.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(path.join(root,'dist')+path.sep))return json(res,404,{error:'Not found.'});
    let bytes;try{bytes=await readFile(file);}catch{return json(res,404,{error:'File missing. Please run npm run survey:build first.'});}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',...headers});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(e){if(!res.headersSent)json(res,e.status||400,{error:e.message||'The request could not be processed.'});else res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`Bushido Meta Observatory: http://127.0.0.1:${port} (${token?'Tally connected':'CSV / set up connection'})`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is already in use.`:'The dashboard could not be started.');process.exitCode=1;});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{clearInterval(timer);server.close();vite?.close();});
