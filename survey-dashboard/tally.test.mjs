import test from 'node:test';
import assert from 'node:assert/strict';
import {downloadTally,FORM_ID} from './tally.mjs';

const questions=[{id:'main',title:'What is your main faction?'}];
const submission=id=>({id,formId:FORM_ID,isCompleted:true,submittedAt:'2026-10-26T12:00:00Z',previewUrl:'private-signed-link',pdfUrl:'private-signed-pdf',responses:[{questionId:'main',answer:'Ito Clan'}]});
const page=(ids,hasMore=false,total=ids.length)=>({questions,submissions:ids.map(submission),hasMore,totalNumberOfSubmissionsPerFilter:{completed:total}});
function mock(pages){const calls=[];return {calls,fetcher:async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(url.includes('/submissions?')?pages.shift():{blocks:[]}),{status:200});}};}
test('All completed pages are fetched from the fixed official host; raw snapshot excludes signed links',async()=>{
  const m=mock([page(['a'],true,2),page(['b'],false,2)]);let raw;
  const result=await downloadTally('synthetic',{fetcher:m.fetcher,onRaw:r=>{raw=r;}});
  assert.equal(result.records.length,2);assert.equal(result.pages,2);assert.ok(m.calls.every(c=>c.url.startsWith('https://api.tally.so/forms/2jEY7L')));assert.ok(m.calls.at(-1).url.endsWith('page=2'));
  assert.equal(m.calls[0].options.headers.Authorization,'Bearer synthetic');assert.equal(raw.submissions[0].previewUrl,undefined);assert.equal(raw.submissions[0].pdfUrl,undefined);
});
test('A changing, duplicated or incomplete response count cannot replace the snapshot',async()=>{
  for(const pages of [[page(['a'],false,2)],[page(['a'],true,2),page(['a'],false,2)],[page([],true,2)]]){const m=mock(pages);await assert.rejects(downloadTally('synthetic',{fetcher:m.fetcher}),/data changed|pagination/);}
});
test('A pretest or another form cannot enter the main run',async()=>{
  const data=page(['a']);data.submissions[0].formId='pretest';
  await assert.rejects(downloadTally('synthetic',{fetcher:mock([data]).fetcher}),/another form/);
});
test('Authentication and network errors never echo credentials or server response bodies',async()=>{
  await assert.rejects(downloadTally('synthetic',{fetcher:async()=>new Response('secret-response',{status:401})}),e=>e.message==='The Tally key is invalid or has expired.');
  await assert.rejects(downloadTally('synthetic',{fetcher:async()=>{throw new Error('sensitive network details');}}),e=>!e.message.includes('sensitive')&&e.message.includes('unavailable'));
});
