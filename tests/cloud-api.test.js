import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

test('cloud deletion confirms the affected row and remote sign-out clears private drafts',async()=>{
  const temporary=await mkdtemp(resolve('node_modules/.sensou-api-'));
  const previous={window:globalThis.window,sessionStorage:globalThis.sessionStorage,BroadcastChannel:globalThis.BroadcastChannel};
  let result=[],authListener,selection;
  const storage=new Map();
  globalThis.window=new EventTarget();
  globalThis.sessionStorage={get length(){return storage.size;},key:i=>[...storage.keys()][i],getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  globalThis.BroadcastChannel=undefined;
  globalThis.sensouTestClient={
    from(){return {delete(){return this;},eq(){return this;},async select(fields){selection=fields;return {data:result,error:null};}};},
    auth:{async signInWithPassword(){return {data:{},error:null};},async getUser(){return {data:{user:null},error:null};},onAuthStateChange(callback){authListener=callback;return {data:{subscription:{unsubscribe(){}}}};}}
  };
  try{
    const bundle=await build({configFile:false,logLevel:'error',ssr:{noExternal:true},resolve:{alias:{'@supabase/supabase-js':resolve('tests/fixtures/supabase-client.mjs')}},
      define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('https://example.supabase.co'),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('sb_publishable_test')},
      build:{target:'es2022',ssr:resolve('src/api.js'),write:false,minify:false,rollupOptions:{output:{inlineDynamicImports:true}}}});
    const file=join(temporary,'api.mjs');await writeFile(file,bundle.output.find(item=>item.type==='chunk').code);
    const {api}=await import(pathToFileURL(file).href);
    await assert.rejects(()=>api.auth('login',{email:'test@example.test',password:'test-only'}),/session could not be verified/);
    await assert.rejects(()=>api.remove('game-id'),/could not be deleted/);
    result=[{id:'game-id'}];await api.remove('game-id');assert.equal(selection,'id');
    storage.set('sensou-draft',JSON.stringify({notes:'private test note'}));
    storage.set('sensou-draft:account-a',JSON.stringify({notes:'private account draft'}));
    let event;const unsubscribe=api.listen((user,type)=>{event={user,type};});
    authListener('SIGNED_OUT');
    assert.equal(storage.has('sensou-draft'),false);assert.deepEqual(event,{user:null,type:'SIGNED_OUT'});
    assert.equal(storage.has('sensou-draft:account-a'),false);
    unsubscribe();
  }finally{
    Object.assign(globalThis,previous);delete globalThis.sensouTestClient;
    await rm(temporary,{recursive:true,force:true});
  }
});
