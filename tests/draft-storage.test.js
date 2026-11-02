import test from 'node:test';
import assert from 'node:assert/strict';
import {draftStorage} from '../src/draft-storage.mjs';
test('disabled browser storage cannot turn successful reports or sign-outs into failures',()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get(){throw new Error('Storage blocked');}});
  try{assert.deepEqual(draftStorage.read(),{});assert.doesNotThrow(()=>draftStorage.write({ownVp:2}));assert.doesNotThrow(()=>draftStorage.clear());}
  finally{if(descriptor)Object.defineProperty(globalThis,'sessionStorage',descriptor);else delete globalThis.sessionStorage;}
});

test('private drafts survive a reload for their owner and stay hidden from guests and other accounts',()=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage'),values=new Map();
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{get length(){return values.size;},key:i=>[...values.keys()][i],getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}});
  try{
    draftStorage.write({notes:'Private A'},'account-a');
    assert.deepEqual(draftStorage.read('account-a'),{notes:'Private A'});
    assert.deepEqual(draftStorage.read(),{});assert.deepEqual(draftStorage.read('account-b'),{});
    draftStorage.write({notes:'Guest draft'});
    assert.deepEqual(draftStorage.read('account-b'),{notes:'Guest draft'});
    draftStorage.write(draftStorage.read('account-b'),'account-b');
    assert.deepEqual(draftStorage.read(),{});assert.deepEqual(draftStorage.read('account-a'),{notes:'Private A'});
    values.set('unrelated','keep');values.set('sensou-draft','legacy');draftStorage.clear();
    assert.deepEqual([...values],[['unrelated','keep']]);
  }finally{if(previous)Object.defineProperty(globalThis,'sessionStorage',previous);else delete globalThis.sessionStorage;}
});
