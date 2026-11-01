import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,scryptSync} from 'node:crypto';
import {mkdtemp,readFile,readdir,writeFile,unlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {workspaceServer} from './helpers.mjs';
import {loadVault,validatePassword,verifyPassword,hashPassword,headers} from '../server/security.js';
import {validateCloudConfig} from '../scripts/cloud-config.mjs';
import {localDate} from '../src/domain.js';

test('authenticated encryption, context binding, protected key persistence, CSRF expiry',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'sensou-security-unit-')),file=path.join(dir,'key');
  try{
    const vault=await loadVault(file),again=await loadVault(file,{mustExist:true});
    const sealed=vault.seal('private','profile:one');
    assert.equal(again.open(sealed,'profile:one'),'private');
    assert.throws(()=>vault.open(sealed,'profile:two'));
    const tampered=Buffer.from(sealed.slice(5),'base64url');tampered[tampered.length-1]^=1;
    assert.throws(()=>vault.open('enc1:'+tampered.toString('base64url'),'profile:one'));
    if(process.platform==='win32')assert.ok((await readFile(file)).toString().startsWith('dpapi1:'));
    const csrf=vault.csrf();assert.ok(vault.validCsrf(csrf));assert.ok(!vault.validCsrf(csrf+'a'));
    const realNow=Date.now;try{Date.now=()=>realNow()+3600001;assert.ok(!vault.validCsrf(csrf));}finally{Date.now=realNow;}

  }finally{if(path.dirname(dir)===tmpdir()&&path.basename(dir).startsWith('sensou-security-unit-'))await rm(dir,{recursive:true,force:true});}
});
test('password policy, slow salted hashing and secret-free deployment guard',async()=>{
  assert.throws(()=>validatePassword('password123456789'));
  assert.throws(()=>validatePassword('a'.repeat(30)));
  validatePassword('a sufficiently long passphrase');
  const hash=await hashPassword('a sufficiently long passphrase');
  assert.equal((await verifyPassword('a sufficiently long passphrase',hash)).valid,true);
  assert.equal((await verifyPassword('wrong',hash)).valid,false);
  const valid={VITE_SUPABASE_URL:'https://example-project.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example',VITE_TURNSTILE_SITE_KEY:'example_public_site_key_12345'};
  assert.equal(validateCloudConfig(valid),valid.VITE_SUPABASE_URL);
  assert.throws(()=>validateCloudConfig({...valid,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_do_not_publish'}));
  const serviceKey='a.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.b';
  assert.throws(()=>validateCloudConfig({...valid,VITE_SUPABASE_PUBLISHABLE_KEY:serviceKey}));
  assert.throws(()=>validateCloudConfig({...valid,VITE_TURNSTILE_SITE_KEY:''}));
  assert.throws(()=>validateCloudConfig({...valid,VITE_SUPABASE_URL:'https://evil.example'}));
  assert.ok(!headers()['Content-Security-Policy'].split(';')[1].includes('unsafe-inline'));
});
test('legacy migration preserves games, encrypts backup, upgrades hashes and fails closed without the original key',async()=>{
  const userId='11111111-1111-4111-8111-111111111111',gameId='22222222-2222-4222-8222-222222222222',password='existing-secure-passphrase';
  const s=await workspaceServer({seed:async dir=>{
    const db=new DatabaseSync(path.join(dir,'sensou.sqlite'));const salt=randomBytes(16).toString('hex');
    db.exec('CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL);CREATE TABLE games(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),payload TEXT NOT NULL,created_at TEXT NOT NULL);');
    db.prepare('insert into users values(?,?,?,?)').run(userId,'legacy@example.test','Legacy player',`${salt}:${scryptSync(password,salt,64).toString('hex')}`);
    const game={ownFaction:'ito-clan',ownTheme:'Cold Blood',opponentFaction:'minimoto-clan',opponentTheme:'The Finest Steel',ownVp:2,opponentVp:1,date:localDate(),scenario:'Ryodo',rice:100,format:'Casual',notes:'Legacy private note'};
    db.prepare('insert into games values(?,?,?,?)').run(gameId,userId,JSON.stringify(game),new Date().toISOString());db.close();
  }});
  try{
    await s.start();const a=s.client();const login=await a.call('/auth/login','POST',{email:'legacy@example.test',password});assert.equal(login.status,200);assert.equal(login.body.user.id,userId);
    const games=(await a.call('/games?mine=1')).body.games;assert.equal(games[0].id,gameId);assert.equal(games[0].notes,'Legacy private note');
    const db=new DatabaseSync(path.join(s.dir,'sensou.sqlite'));
    assert.match(db.prepare('select password from users').get().password,/^scrypt:131072/);
    db.prepare('update sessions set last_seen=?').run(Date.now()-31*60000);assert.equal((await a.call('/auth/me')).body.user,null);
    await a.call('/auth/login','POST',{email:'legacy@example.test',password});
    db.prepare('update sessions set created=?').run(Date.now()-13*3600000);assert.equal((await a.call('/auth/me')).body.user,null);db.close();
    await s.stop();
    const key=await readFile(s.env.SECURITY_KEY_FILE);const vault=await loadVault(s.env.SECURITY_KEY_FILE,{mustExist:true});
    const backup=(await readdir(s.dir)).find(name=>/^pre-security-.*\.enc$/.test(name));assert.ok(backup);
    const restored=vault.open(await readFile(path.join(s.dir,backup),'utf8'),'database-backup',true);
    assert.equal(restored.subarray(0,15).toString(),'SQLite format 3');
    const restoredFile=path.join(s.dir,'restored.sqlite');await writeFile(restoredFile,restored);
    const original=new DatabaseSync(restoredFile,{readOnly:true});assert.equal(original.prepare('select count(*) n from games').get().n,1);assert.equal(original.prepare('select name from users').get().name,'Legacy player');original.close();
    await unlink(s.env.SECURITY_KEY_FILE);await assert.rejects(()=>s.start(),/Encryption key missing/);
    await writeFile(s.env.SECURITY_KEY_FILE,randomBytes(32));await assert.rejects(()=>s.start(),/legacy key|cannot be decrypted/);
    await writeFile(s.env.SECURITY_KEY_FILE,key);await s.start();assert.equal((await s.client().call('/games')).body.games.length,1);
  }finally{await s.cleanup();}
});
