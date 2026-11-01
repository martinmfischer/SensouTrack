import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewedPublicTexts} from '../survey-dashboard/public-texts.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
test('only unchanged manually approved text passes; public documents cannot expose respondent profiles',()=>{
  const row={id:'RAW-SUBMISSION',respondentId:'RAW-PERSON',submittedAt:'2026-10-27T12:34:56Z',experience:'Experienced',mainFaction:'Private group',problems:'A reviewable opinion',themeComment:'Unreviewed text'};
  const ledger={schema:1,reviewedAt:'2026-10-27T15:00:00Z',entries:{[hash(row.id+'\0Meta')]:{sourceHash:hash(row.problems),status:'redacted',text:'A [personal detail removed] opinion',reviewedAt:'2026-10-27T15:00:00Z',publicId:'12345678-1234-4234-8234-123456789012'}}};
  const result=reviewedPublicTexts({formId:'2jEY7L',records:[row]},ledger);
  assert.equal(result.texts.length,1);assert.equal(result.pending,1);assert.equal(result.redacted,1);
  assert.deepEqual(Object.keys(result.texts[0]),['id','type','text','edited']);
  assert.ok(!/RAW-|Experienced|Private group|12:34|Unreviewed/.test(JSON.stringify(result)));
  assert.equal(reviewedPublicTexts({formId:'2jEY7L',records:[{...row,problems:'Changed after review'}]},ledger).texts.length,0);
});
