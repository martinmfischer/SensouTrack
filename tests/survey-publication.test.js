import test from 'node:test';
import assert from 'node:assert/strict';
import {publicPublication} from '../survey-dashboard/publication.mjs';
import {handleRefresh,refreshPublication} from '../survey-dashboard/cloud-publication.mjs';
import {normalizeRows,FACTIONS} from '../survey-dashboard/analysis.mjs';

const snapshot={formId:'2jEY7L',syncedAt:'2026-10-30T22:00:00Z',records:normalizeRows(Array.from({length:8},(_,i)=>({'Submission ID':'PRIVATE-'+i,'Respondent ID':'SECRET-'+i,'Submitted at':'2026-10-30T10:00:00Z','Main faction':FACTIONS[0],'What are the biggest problems?':'PRIVATE-TEXT'}))).records};
const ledger={schema:1,entries:{},reviewedAt:null};
test('publication applies one privacy boundary to all groups and holds unreviewed text',()=>{
  const files=publicPublication(snapshot,ledger),json=JSON.stringify(files);
  assert.equal(files['summary.json'].total,8);assert.equal(files['summary.json'].syncedAt,snapshot.syncedAt);
  assert.ok(files['groups/faction-0.json']);assert.equal(files['texts.json'].texts.length,0);
  assert.equal(files['texts.json'].pending,8);assert.equal(files['texts.json'].reviewedDay,null);
  assert.ok(!/PRIVATE|SECRET|respondentId|submittedAt|protectedToken/.test(json));
  assert.ok(!publicPublication({...snapshot,records:snapshot.records.slice(0,4)},ledger)['groups/faction-0.json']);
});
test('cloud refresh rejects public callers before any download or storage request',async()=>{
  const response=await handleRefresh(new Request('https://example.test',{method:'POST'}),{SURVEY_SYNC_TOKEN:'a'.repeat(64)},{fetcher:()=>{throw Error('must not fetch');}});
  assert.equal(response.status,401);
  const malformed=await handleRefresh(new Request('https://example.test',{method:'POST',headers:{authorization:'Bearer '+'é'.repeat(64)}}),{SURVEY_SYNC_TOKEN:'a'.repeat(64)});
  assert.equal(malformed.status,401);
});
test('manifest commits last; a failed group upload preserves the previous publication',async()=>{
  const env={TALLY_API_KEY:'fake',SUPABASE_SERVICE_ROLE_KEY:'private-test-key',SUPABASE_URL:'https://example.supabase.co'},writes=[];
  const fetcher=async(url,options={})=>{
    if(url.endsWith('/ledger.json'))return Response.json(ledger);
    if(!options.method&&url.endsWith('/publication.json'))return Response.json({statusCode:'404',message:'Object not found'},{status:400});
    writes.push({url,body:options.body});return Response.json({ok:true});
  };
  await refreshPublication(env,{fetcher,download:async()=>snapshot});
  assert.ok(writes.at(-1).url.endsWith('/publication.json'));
  const meta=JSON.parse(writes.at(-1).body);assert.equal(meta.mode,'hourly');assert.ok(writes.slice(0,-1).every(w=>w.url.includes(meta.revision)));
  assert.ok(writes.every(w=>!/PRIVATE|SECRET|private-test-key/.test(w.body)));
  writes.length=0;
  await assert.rejects(refreshPublication(env,{download:async()=>snapshot,fetcher:async(url,options)=>url.includes('/groups/')?new Response(null,{status:500}):fetcher(url,options)}));
  assert.ok(!writes.some(w=>w.url.endsWith('/publication.json')));
});
