import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SURVEY_CLOSED} from './survey-status.mjs';
import {handleRefresh} from './cloud-publication.mjs';
test('final public files match their saved hashes and the site has no live survey source',async()=>{
 const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
 const manifest=await json('../public/survey/freeze.json');assert.equal(SURVEY_CLOSED,true);assert.equal(manifest.mode,'frozen');
 for(const [name,hash]of Object.entries(manifest.files))assert.equal(createHash('sha256').update(await readFile(new URL('../public/survey/'+name,import.meta.url))).digest('hex'),hash,name);
 const code=await readFile(new URL('./public.jsx',import.meta.url),'utf8');assert.ok(!/supabase\.co|setInterval|Take the survey|Update overdue/.test(code));
 const groups=await json('../public/survey/groups.json');for(const group of groups.groups)assert.ok(manifest.files['groups/'+group.id+'.json']);
 const texts=await json('../public/survey/texts.json');assert.equal(texts.texts.length,214);assert.equal(texts.pending,0);
 const response=await handleRefresh(new Request('https://example.test',{method:'POST',headers:{authorization:'Bearer '+'a'.repeat(64)}}),{SURVEY_SYNC_TOKEN:'a'.repeat(64)},{fetcher:()=>{throw Error('closed survey must not fetch');},download:()=>{throw Error('closed survey must not download');}});assert.equal(response.status,410);
});
