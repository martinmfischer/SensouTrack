import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {textHash,resolveDocuments,summarizeDocuments,intersectDocuments,countsCsv} from './synthesis-analysis.mjs';
const topics=[{id:'tempo',label:'Timing'},{id:'agency',label:'Interaction'}];
test('curated document counts preserve question denominators, multi-label membership and intersections',()=>{
 const docs=[{ref:'R001',type:'Meta',topics:['tempo','agency'],disposition:'substantive',overallPositive:true},{ref:'R002',type:'Themes',topics:['tempo'],disposition:'substantive'},{ref:'R003',type:'Meta',topics:[],disposition:'abstention'}];
 const s=summarizeDocuments(docs,topics);assert.equal(s.total,3);assert.equal(s.substantive,2);assert.equal(s.byQuestion.Meta,2);assert.equal(s.topics[0].count,2);assert.equal(s.topics[0].byQuestion.Meta,1);assert.equal(s.topics[1].count,1);assert.equal(s.positiveOverall,1);assert.deepEqual(intersectDocuments(docs,['tempo','agency']).map(d=>d.ref),['R001']);
 assert.ok(countsCsv(s,'edition').includes('"Timing","Biggest meta problems","1","2"'));
});
test('new, edited, moved and deleted text cannot inherit an existing curated assignment',async()=>{
 const d={id:'public-document',type:'Meta',text:'Original reviewed wording'},entry={id:d.id,type:d.type,ref:'R001',sourceHash:await textHash(d.text),topics:['tempo']};
 assert.equal((await resolveDocuments({schema:1,texts:[d]},[entry])).documents.length,1);
 const edited=await resolveDocuments({schema:1,texts:[{...d,text:'Changed wording'}]},[entry]);assert.equal(edited.documents.length,0);assert.deepEqual(edited.changed,['R001']);
 assert.deepEqual((await resolveDocuments({schema:1,texts:[{...d,type:'Themes'}]},[entry])).changed,['R001']);
 const next=await resolveDocuments({schema:1,texts:[{...d,id:'new-document'}]},[entry]);assert.equal(next.documents.length,0);assert.equal(next.unclassified.length,1);assert.deepEqual(next.removed,['R001']);
 await assert.rejects(resolveDocuments({schema:1,texts:[d,d]},[entry]),/duplicate/);
});
test('the complete first-pass edition matches every reviewed source and every compiled quote',async()=>{
 const report=JSON.parse(await readFile(new URL('./synthesis-report.json',import.meta.url),'utf8')),corpus=JSON.parse(await readFile(new URL('../public/survey/texts.json',import.meta.url),'utf8'));
 const r=await resolveDocuments(corpus,report.documents),byRef=new Map(r.documents.map(d=>[d.ref,d]));assert.equal(r.documents.length,214);assert.equal(r.unclassified.length,0);assert.equal(r.changed.length,0);assert.equal(r.removed.length,0);
 assert.equal(summarizeDocuments(r.documents,report.topics).substantive,208);assert.equal(report.stats.positiveOverall,12);assert.deepEqual(report.stats.byQuestion,{Meta:89,Themes:59,'Faction & Matchups':66});
 for(const chapter of report.chapters){assert.ok(chapter.quote.end>chapter.quote.start);assert.ok(byRef.get(chapter.quote.ref).text.slice(chapter.quote.start,chapter.quote.end).trim());assert.ok(!Object.hasOwn(chapter.quote,'text'));}
 const serialized=JSON.stringify(report);assert.ok(!/respondentId|submittedAt|sourceToken|protectedToken/.test(serialized));for(const d of corpus.texts)assert.ok(!serialized.includes(d.text),'Source wording must come from the current publication, not the report bundle');
 for(const pair of report.connections){const docs=intersectDocuments(r.documents,[pair.a,pair.b]);assert.equal(pair.count,docs.length);assert.deepEqual(pair.refs,docs.map(d=>d.ref));}
 for(const d of report.documents)assert.equal(d.ref,'A-'+d.id.replaceAll('-','').slice(0,12).toUpperCase());
 assert.deepEqual(report.documents.map(d=>d.id),report.documents.map(d=>d.id).sort());
 assert.equal(report.cases.length,15);assert.equal(report.topics.length,17);
});
