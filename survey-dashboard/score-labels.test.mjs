import test from 'node:test';
import assert from 'node:assert/strict';
import {score,normalizeRows,aggregate} from './analysis.mjs';
test('labelled neutral scores contribute to satisfaction and valid-rating denominators',()=>{
  for(const [label,value] of [['4 (neutral)',4],['4 — Neutral',4],['1 (Very dissatisfied)',1],['7',7]])assert.equal(score(label),value);
  for(const label of ['4.5','14','4abc','8 (strong)','Not enough experience','4 (neutral) extra'])assert.equal(score(label),null);
  const {records}=normalizeRows(['4 (neutral)','4 (neutral)','7'].map((v,i)=>({'Submission ID':String(i),'Main faction':'Ito Clan','How satisfied are you with the current meta?':v})));
  const s=aggregate(records).satisfaction;
  assert.equal(s.n,3);assert.equal(s.mean,5);assert.equal(s.distribution[3],2);
});
