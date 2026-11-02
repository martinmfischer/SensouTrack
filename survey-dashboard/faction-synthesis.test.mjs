import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateFactionReview,factionSources} from './faction-synthesis.mjs';
import {resolveDocuments} from './synthesis-analysis.mjs';
const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
test('every faction reading has reviewed, faction-specific evidence and literal names match source text',async()=>{
 const [coding,editorial,corpus,report]=await Promise.all(['./synthesis/faction-coding.json','./synthesis/faction-editorial.json','../public/survey/texts.json','./synthesis-report.json'].map(json));
 const {documents}=await resolveDocuments(corpus,report.documents);
 assert.ok(validateFactionReview(coding,editorial,documents));
 const shiho=factionSources(coding.entries,documents,'Shiho Clan');
 assert.equal(shiho.find(d=>d.ref==='A-F911757971A8').assignment.kind,'context');
 assert.ok(!shiho.some(d=>d.ref==='A-A9BDF41688E1'),'Generic local-group comment must not inherit author faction');
 assert.ok(!factionSources(coding.entries,documents,'The Awoken').some(d=>d.ref==='A-819D7E10DBAD'),'Akari is not assigned to Awoken');
 const removed=documents.filter(d=>d.ref!=='A-F911757971A8');
 assert.ok(!factionSources(coding.entries,removed,'Shiho Clan').some(d=>d.ref==='A-F911757971A8'));
 assert.throws(()=>validateFactionReview({...coding,entries:[...coding.entries,coding.entries[0]]},editorial,documents),/Invalid faction assignment/);
 assert.throws(()=>validateFactionReview(coding,{...editorial,profiles:editorial.profiles.slice(1)},documents),/Incomplete/);
 const text=JSON.stringify({coding,editorial});assert.ok(!/respondentId|submittedAt|mainFaction|sourceToken/.test(text));
 for(const f of editorial.profiles){const all=factionSources(coding.entries,documents,f.faction),named=factionSources(coding.entries,documents,f.faction,'mention'),context=factionSources(coding.entries,documents,f.faction,'context');assert.equal(all.length,named.length+context.length);assert.ok(f.findings.length>=4);}
});
