import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,copyFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import configuration from '../vite.config.js';

test('public advertising flags cannot change the account app privacy notices or security policy',async()=>{
  const values={VITE_ADSENSE_ACTIVE:'true',VITE_ADSENSE_SERVING:'true',VITE_ADSENSE_PUBLISHER_ID:'ca-pub-1234567890123456',VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',VITE_TURNSTILE_SITE_KEY:'test_public_turnstile_site_key'};
  const previous=Object.fromEntries(Object.keys(values).map(key=>[key,process.env[key]]));
  const temporary=await mkdtemp(join(tmpdir(),'sensou-build-test-'));
  try{
    Object.assign(process.env,values);
    for(const file of ['privacy.html','datenschutz.html'])await copyFile('public/'+file,join(temporary,file));
    const config=configuration({mode:'cloud'});
    await config.plugins.find(plugin=>plugin.name==='restrict-authentication-origin').writeBundle({dir:temporary});
    assert.equal(await readFile(join(temporary,'privacy.html'),'utf8'),await readFile('public/privacy.html','utf8'));
    assert.ok(!(await readFile(join(temporary,'_headers'),'utf8')).includes('googlesyndication'));
  }finally{
    for(const [key,value] of Object.entries(previous))if(value===undefined)delete process.env[key];else process.env[key]=value;
    await rm(temporary,{recursive:true,force:true});
  }
});
