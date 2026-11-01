import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import http from 'node:http';
import {workspaceServer} from './helpers.mjs';
import {localDate} from '../src/domain.js';
const password='test-secure-passphrase-123';
const game={ownFaction:'ito-clan',ownTheme:'Cold Blood',opponentFaction:'minimoto-clan',opponentTheme:'The Finest Steel',ownVp:2,opponentVp:1,date:localDate(),scenario:'Ryodo',rice:100,format:'Casual',notes:'Secret personal note'};
test('password sign-in, session rotation, legacy MFA compatibility, ownership, encryption and logout',async()=>{
  const s=await workspaceServer();
  try{
    await s.start();const a=s.client(),b=s.client(),anonymous=s.client();
    assert.equal((await anonymous.call('/games?mine=1')).status,401);
    assert.equal((await a.call('/auth/register','POST',{name:'Test player',email:'test@example.test',password:'short'})).status,400);
    const register=await a.call('/auth/register','POST',{name:'Test player',email:'test@example.test',password});
    assert.equal(register.status,200);assert.equal('mfaRequired' in register.body.user,false);
    assert.match(register.headers.get('set-cookie'),/HttpOnly/);assert.match(register.headers.get('set-cookie'),/SameSite=Strict/);
    assert.equal((await a.call('/games?mine=1')).status,200);
    const old=a.jar.sensou_session;
    assert.equal((await a.call('/auth/login','POST',{email:'test@example.test',password})).status,200);
    assert.notEqual(a.jar.sensou_session,old);
    const stale=s.client();stale.jar.sensou_session=old;
    assert.equal((await stale.call('/games?mine=1')).status,401);
    assert.equal((await a.call('/auth/mfa/setup','POST',{})).status,404);
    assert.equal((await a.call('/auth/mfa/verify','POST',{code:'123456'})).status,404);
    assert.equal((await a.call('/games','POST',{...game,ownVp:3})).status,400);
    assert.equal((await a.call('/games','POST',game,{Origin:'https://evil.example'})).status,403);
    const created=await a.call('/games','POST',game);assert.equal(created.status,201);
    assert.equal((await a.call('/games','POST',game)).status,409);
    const publicList=await anonymous.call('/games');assert.equal(publicList.body.games.length,1);
    assert.ok(!JSON.stringify(publicList.body).includes('Secret'));assert.ok(!JSON.stringify(publicList.body).includes('test@example'));
    assert.equal((await a.call('/games?mine=1')).body.games[0].notes,game.notes);
    const db=new DatabaseSync(s.dir+'/sensou.sqlite');
    const record=db.prepare('SELECT * FROM users WHERE id=?').get(register.body.user.id);
    assert.ok(record.email.startsWith('hmac:'));assert.ok(record.name.startsWith('enc1:'));
    assert.match(record.password,/^scrypt:131072:8:1:/);
    assert.ok(!JSON.stringify(db.prepare('SELECT * FROM games').all()).includes(game.notes));
    assert.ok(!JSON.stringify(db.prepare('SELECT * FROM sessions').all()).includes(a.jar.sensou_session));
    // A database from the previous release can retain unused MFA columns/factors.
    db.exec('ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 1; ALTER TABLE users ADD COLUMN mfa_secret TEXT;');
    db.prepare('update users set mfa_secret=?').run('legacy-unused-factor');db.close();
    await b.call('/auth/register','POST',{name:'Other player',email:'other@example.test',password});
    assert.equal((await b.call('/games/'+created.body.game.id,'DELETE')).status,404);
    assert.equal((await b.call('/games?mine=1')).body.games.length,0);
    await s.stop();await s.start();
    assert.equal((await a.call('/games?mine=1')).body.games[0].notes,game.notes);
    const second=s.client();assert.equal((await second.call('/auth/login','POST',{email:'test@example.test',password})).status,200);
    assert.equal((await second.call('/games?mine=1')).body.games[0].notes,game.notes);
    await second.call('/auth/logout-all','POST',{});
    assert.equal((await a.call('/auth/me')).body.user,null);
    await a.call('/auth/login','POST',{email:'test@example.test',password});
    assert.equal((await a.call('/auth/password','POST',{currentPassword:'wrong',password:'another-secure-passphrase-456'})).status,401);
    assert.equal((await a.call('/auth/password','POST',{currentPassword:password,password:'another-secure-passphrase-456'})).status,200);
    assert.equal((await a.call('/auth/me')).body.user,null);
    assert.equal((await a.call('/auth/login','POST',{email:'test@example.test',password})).status,401);
    assert.equal((await a.call('/auth/login','POST',{email:'test@example.test',password:'another-secure-passphrase-456'})).status,200);
    assert.equal((await a.call('/games/'+created.body.game.id,'DELETE')).status,200);
  }finally{await s.cleanup();}
});

test('CSRF, login brute-force limits, Host checks, secret paths, safe errors and CSP',async()=>{
  const s=await workspaceServer({dev:true});
  try{
    await s.start();
    const noCsrf=await fetch(s.base+'/api/auth/login',{method:'POST',headers:{Origin:s.base,'Content-Type':'application/json'},body:JSON.stringify({email:'nobody@example.test',password})});
    assert.equal(noCsrf.status,403);
    const wrongHost=await new Promise((resolve,reject)=>{const req=http.get(s.base+'/api/games',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});
    assert.equal(wrongHost,421);
    for(const route of ['/data/sensou.sqlite','/.local-secrets/master.key','/server/security.js','/%2edata/sensou.sqlite','/@fs/F:/Projects/SensouTrack/data/sensou.sqlite','/.env.local'])assert.ok((await fetch(s.base+route,{method:'HEAD'})).status>=400,route);
    const a=s.client();
    const malformed=await a.call('/auth/login','POST',null);assert.equal(malformed.status,400);assert.ok(!JSON.stringify(malformed.body).includes('TypeError'));
    let result;for(let i=0;i<13;i++)result=await a.call('/auth/login','POST',{email:'nobody@example.test',password:'incorrect-password'});assert.equal(result.status,429);
    const headers=(await fetch(s.base+'/')).headers;
    assert.equal(headers.get('x-content-type-options'),'nosniff');assert.match(headers.get('content-security-policy'),/object-src 'none'/);
    assert.match(headers.get('content-security-policy'),/base-uri 'none'/);assert.equal(headers.get('referrer-policy'),'no-referrer');
  }finally{await s.cleanup();}
});
