import {FACTIONS} from './analysis.mjs';

export function validateFactionReview(coding,editorial,documents){
 const refs=new Map(documents.map(d=>[d.ref,d])),keys=new Set();
 if(coding.schema!==1||editorial.schema!==1||coding.reviewedDocuments!==documents.length)throw Error('Faction review corpus mismatch');
 for(const e of coding.entries){
  const key=e.faction+'|'+e.ref;
  if(!FACTIONS.includes(e.faction)||!refs.has(e.ref)||keys.has(key)||!['mention','context'].includes(e.kind))throw Error('Invalid faction assignment '+key);
  if(e.kind==='mention'&&(!e.terms?.length||e.terms.some(t=>!refs.get(e.ref).text.includes(t))))throw Error('Faction mention does not match '+e.ref);
  if(e.kind==='context'&&!e.reason?.trim())throw Error('Missing context rationale '+e.ref);
  keys.add(key);
 }
 if(editorial.profiles.length!==FACTIONS.length||new Set(editorial.profiles.map(p=>p.faction)).size!==FACTIONS.length)throw Error('Incomplete faction profiles');
 for(const p of editorial.profiles){
  if(!FACTIONS.includes(p.faction)||!p.lead?.trim()||!p.findings?.length)throw Error('Invalid faction profile');
  for(const f of p.findings){
  if(!f.refs.length||new Set(f.refs).size!==f.refs.length||f.refs.some(ref=>!keys.has(p.faction+'|'+ref)))throw Error('Finding has unassigned evidence: '+p.faction+' / '+f.title);
  }
 }
 return true;
}

export function factionSources(entries,documents,faction,kind='all'){
 const byRef=new Map(documents.map(d=>[d.ref,d]));
 return entries.filter(e=>e.faction===faction&&(kind==='all'||e.kind===kind)&&byRef.has(e.ref)).map(e=>({...byRef.get(e.ref),assignment:e}));
}
