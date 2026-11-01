import test from 'node:test';
import assert from 'node:assert/strict';
import {dpapi} from './credentials.mjs';
test('Windows DPAPI round trip without exposing the input', {skip:process.platform!=='win32'},async()=>{
  const plain='synthetic-non-secret-test';const protectedValue=await dpapi(plain);
  assert.notEqual(protectedValue,plain);assert.equal(await dpapi(protectedValue,true),plain);
});
