import test from 'node:test';
import assert from 'node:assert/strict';
import {draftStorage} from '../src/draft-storage.mjs';
test('disabled browser storage cannot turn successful reports or sign-outs into failures',()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get(){throw new Error('Storage blocked');}});
  try{assert.deepEqual(draftStorage.read(),{});assert.doesNotThrow(()=>draftStorage.write({ownVp:2}));assert.doesNotThrow(()=>draftStorage.clear());}
  finally{if(descriptor)Object.defineProperty(globalThis,'sessionStorage',descriptor);else delete globalThis.sessionStorage;}
});
