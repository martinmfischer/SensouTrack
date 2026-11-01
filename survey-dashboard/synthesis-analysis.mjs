// Pure document-level calculations shared by the build and the browser.
export const QUESTION_LABELS={'Meta':'Biggest meta problems','Themes':'Why themes feel strong or weak','Faction & Matchups':'Own faction & matchups'};
export async function textHash(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');}
export function summarizeDocuments(documents,topics){
  const byQuestion=Object.fromEntries(Object.keys(QUESTION_LABELS).map(q=>[q,documents.filter(d=>d.type===q).length]));
  return {total:documents.length,substantive:documents.filter(d=>d.disposition==='substantive').length,abstentions:documents.filter(d=>d.disposition==='abstention').length,brief:documents.filter(d=>d.disposition==='brief').length,positiveOverall:documents.filter(d=>d.overallPositive).length,byQuestion,
    topics:topics.map(topic=>{const members=documents.filter(d=>d.topics.includes(topic.id));return {...topic,count:members.length,byQuestion:Object.fromEntries(Object.keys(QUESTION_LABELS).map(q=>[q,members.filter(d=>d.type===q).length])),refs:members.map(d=>d.ref)};})};
}
export async function resolveDocuments(corpus,entries){
  if(corpus?.schema!==1||!Array.isArray(corpus.texts))throw Error('Invalid reviewed-text corpus.');
  const seen=new Set();for(const d of corpus.texts){if(!d||typeof d.id!=='string'||typeof d.text!=='string'||!Object.hasOwn(QUESTION_LABELS,d.type)||seen.has(d.id))throw Error('Invalid or duplicate public answer.');seen.add(d.id);}
  const live=new Map(corpus.texts.map(d=>[d.id,d])),coded=new Map(entries.map(e=>[e.id,e])),documents=[],changed=[],removed=[];
  await Promise.all(entries.map(async e=>{const d=live.get(e.id);if(!d){removed.push(e.ref);return;}if(d.type!==e.type||await textHash(d.text)!==e.sourceHash){changed.push(e.ref);return;}documents.push({...d,...e});}));
  documents.sort((a,b)=>a.ref.localeCompare(b.ref));
  const unclassified=corpus.texts.filter(d=>!coded.has(d.id));
  return {documents,changed,removed,unclassified};
}
export function intersectDocuments(documents,topics){return documents.filter(d=>topics.every(t=>d.topics.includes(t)));}
export function countsCsv(stats,edition,codebookVersion=''){
 const rows=[['Edition','Codebook version','Topic','Question','Answers with topic','Reviewed answer denominator','Counting unit']];
 for(const t of stats.topics)for(const q of ['',...Object.keys(QUESTION_LABELS)])rows.push([edition,codebookVersion,t.label,q?QUESTION_LABELS[q]:'All questions',q?t.byQuestion[q]:t.count,q?stats.byQuestion[q]:stats.total,'Answer documents; topics overlap']);
 return '\uFEFF'+rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n');
}
