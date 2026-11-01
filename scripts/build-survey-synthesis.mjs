import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolveDocuments,summarizeDocuments,textHash,intersectDocuments} from '../survey-dashboard/synthesis-analysis.mjs';
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const args=process.argv.slice(2),value=key=>{const i=args.indexOf(key);if(i<0)return null;if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing value for '+key);return args[i+1];};
const corpus=await json(value('--input')||'public/survey/texts.json'),codebook=await json('survey-dashboard/synthesis/codebook.json'),coding=await json('survey-dashboard/synthesis/coding.json'),editorial=await json('survey-dashboard/synthesis/editorial.json');
const ids=new Set(),refs=new Set(),topics=new Set(codebook.topics.map(t=>t.id));
if(topics.size!==codebook.topics.length||coding.codebookVersion!==codebook.version)throw Error('Codebook version/IDs mismatch.');
const entries=coding.entries.map(e=>{
 if(ids.has(e.id)||refs.has(e.ref)||!/^A-[0-9A-F]{12}$/.test(e.ref)||!/^[a-f0-9]{64}$/.test(e.sourceHash)||new Set(e.topics).size!==e.topics.length||e.topics.some(t=>!topics.has(t))||!['substantive','brief','abstention'].includes(e.disposition))throw Error('Invalid coding entry '+e.ref);
 if((e.disposition==='substantive')!==Boolean(e.topics.length)||typeof e.overallPositive!=='boolean'||typeof e.limitedExperience!=='boolean')throw Error('Incomplete analytical assignment '+e.ref);
 ids.add(e.id);refs.add(e.ref);if(!Object.hasOwn(codebook.questions,e.type))throw Error('Question missing for '+e.ref);return {...e};
});
const resolved=await resolveDocuments(corpus,entries);
if(args.includes('--prepare')){
 const pending=[...resolved.unclassified,...corpus.texts.filter(d=>entries.some(e=>e.id===d.id&&resolved.changed.includes(e.ref)))];
 const queue={codebookVersion:codebook.version,new:resolved.unclassified.length,changed:resolved.changed,removed:resolved.removed,documents:await Promise.all(pending.map(async d=>({...d,ref:'A-'+d.id.replaceAll('-','').slice(0,12).toUpperCase(),sourceHash:await textHash(d.text),topics:[],disposition:'unreviewed'})))};
 await mkdir('survey-dashboard/private',{recursive:true});await writeFile('survey-dashboard/private/synthesis-review-queue.json',JSON.stringify(queue,null,2));console.log(JSON.stringify({new:queue.new,changed:queue.changed.length,removed:queue.removed.length,queue:'survey-dashboard/private/synthesis-review-queue.json'}));process.exit(0);
}
if(resolved.changed.length||resolved.removed.length||resolved.unclassified.length)throw Error('Coding review required: '+resolved.unclassified.length+' new, '+resolved.changed.length+' changed, '+resolved.removed.length+' removed. Run npm run survey:synthesis:prepare.');
for(const d of entries)if(!d.type)throw Error('Question missing for '+d.ref);
const byRef=new Map(resolved.documents.map(d=>[d.ref,d]));
function compile(value){
 if(Array.isArray(value))return value.map(compile);
 if(!value||typeof value!=='object')return value;
 const result={};
 for(const [key,item]of Object.entries(value)){
  if(key==='refs'||key==='counterRefs'){if(!Array.isArray(item)||new Set(item).size!==item.length||item.some(ref=>!byRef.has(ref)))throw Error('Unknown or duplicate evidence reference');result[key]=item;}
  else if(key==='quote'){
   const d=byRef.get(item.ref),start=d?.text.indexOf(item.text);if(!d||!item.text||start<0)throw Error('Quote does not match '+item.ref);
   result.quote={ref:item.ref,start,end:start+item.text.length};
  }else result[key]=compile(item);
 }
 return result;
}
if(Object.keys(editorial.topicNotes).some(t=>!topics.has(t))||codebook.topics.some(t=>!editorial.topicNotes[t.id]))throw Error('Incomplete topic interpretation.');
for(const pair of editorial.connections)if(!topics.has(pair.a)||!topics.has(pair.b)||pair.a===pair.b)throw Error('Invalid connection.');
const content=compile(editorial);content.connections=content.connections.map(pair=>{const docs=intersectDocuments(resolved.documents,[pair.a,pair.b]);return {...pair,count:docs.length,refs:docs.map(d=>d.ref)};});
const report={schema:2,status:'first-pass',edition:coding.edition,reviewedAt:coding.reviewedAt,cutoff:coding.cutoff,codebookVersion:codebook.version,sourceSubmissions:coding.sourceSubmissions,sourceTextSubmissions:coding.sourceTextSubmissions,questions:codebook.questions,topics:codebook.topics,methods:codebook.methods,references:codebook.references,documents:entries,stats:summarizeDocuments(resolved.documents,codebook.topics),...content};
const output=JSON.stringify(report,null,2)+'\n',destination='survey-dashboard/synthesis-report.json';
if(args.includes('--check')){if(await readFile(destination,'utf8')!==output)throw Error('Synthesis output is stale. Run npm run survey:synthesis:build.');}
else await writeFile(destination,output);
console.log(JSON.stringify({checked:args.includes('--check'),documents:report.stats.total,substantive:report.stats.substantive,topics:report.topics.length,chapters:report.chapters.length,cases:report.cases.length,positiveOverall:report.stats.positiveOverall,edition:report.edition}));
