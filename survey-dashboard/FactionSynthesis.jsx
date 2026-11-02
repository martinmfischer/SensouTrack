import React,{useEffect,useMemo,useState} from 'react';
import {ArrowRight,FileText} from 'lucide-react';
import {FACTIONS} from './analysis.mjs';
import report from './synthesis-report.json';
import {resolveDocuments} from './synthesis-analysis.mjs';
import {factionSources} from './faction-synthesis.mjs';
import {factionSlug} from './written-response-routes.mjs';
import {EvidenceDialog} from './SynthesisReport.jsx';

const review=report.factionReview;
export default function FactionSynthesis({slug,texts,sourceVersion}){
 const [local,setLocal]=useState(null),[resolved,setResolved]=useState(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0),[evidence,setEvidence]=useState(null);
 const corpus=texts||local,key=useMemo(()=>JSON.stringify(corpus?.texts||null),[corpus]);
 useEffect(()=>{if(texts)return;const c=new AbortController();setFailed(false);fetch('/api/public-texts',{signal:c.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setLocal).catch(e=>{if(e.name!=='AbortError')setFailed(true);});return()=>c.abort();},[texts,sourceVersion,retry]);
 useEffect(()=>{let cancelled=false;if(corpus)resolveDocuments(corpus,report.documents).then(r=>{if(!cancelled){setResolved(r);setFailed(false);}}).catch(()=>{if(!cancelled)setFailed(true);});return()=>{cancelled=true;};},[key,retry]);
 useEffect(()=>setEvidence(null),[slug]);
 if(failed)return <section className="card" role="alert">The faction analysis could not be loaded. <button onClick={()=>setRetry(n=>n+1)}>Retry</button></section>;
 if(!resolved)return <section className="card" role="status">Loading faction analysis…</section>;
 const faction=FACTIONS.find(f=>factionSlug(f)===slug),profile=review.profiles.find(p=>p.faction===faction),docs=resolved.documents;
 const sources=factionSources(review.entries,docs,faction),named=sources.filter(d=>d.assignment.kind==='mention'),context=sources.filter(d=>d.assignment.kind==='context'),byRef=new Map(sources.map(d=>[d.ref,d]));
 const open=(title,answers)=>setEvidence({title,refs:answers.map(d=>d.ref)});
 const changed=resolved.changed.length+resolved.removed.length;
 return <section className="faction-synthesis">
  <div className="card faction-synthesis-intro"><div className="eyebrow">WRITTEN RESPONSES / FACTION REVIEW</div><div className="faction-synthesis-heading"><h2>What players say about each faction</h2><span className="badge">Edition {review.edition}</span></div><p>Comments about each faction, including answers that describe its models or refer to “my faction” without naming it.</p><label><span>Faction discussed</span><select aria-label="Faction for written analysis" value={faction?factionSlug(faction):''} onChange={e=>{location.hash='comments/factions/'+e.target.value;}}><option value="">All factions</option>{FACTIONS.map(f=><option key={f} value={factionSlug(f)}>{f}</option>)}</select></label></div>
  {(changed>0||resolved.unclassified.length>0)&&<p className="syn-drift-note" role="status">This reading covers the {report.edition} coded corpus. {resolved.unclassified.length} new answers await review; {changed} edition answers have changed or been removed. Source lists include only matching published texts.</p>}
  {!profile?<div className="faction-review-grid">{review.profiles.map(p=>{const n=factionSources(review.entries,docs,p.faction).length;return <a className="card faction-review-preview" href={'#comments/factions/'+factionSlug(p.faction)} key={p.faction}><span className="eyebrow">{n} linked answers</span><h3>{p.faction}</h3><p>{p.lead}</p><span className="syn-evidence-link">Read faction analysis <ArrowRight size={15}/></span></a>;})}</div>:<>
   <header className="faction-synthesis-title"><a href="#comments/factions">All factions</a><h3>{faction}</h3><p>{profile.lead}</p></header>
   <div className="faction-evidence-paths">{[['Named in the answer',named,'Faction names, abbreviations and common shorthand anywhere in the text.'],['Resolved from context',context,'The subject is implicit: named models or themes, an own-faction answer, or a first-person comparison.']].map(([title,answers,description])=><article className="card" key={title}><span className="faction-source-total">{answers.length}</span><h4>{title}</h4><p>{description}</p><button className="syn-evidence-link" disabled={!answers.length} onClick={()=>open(faction+' · '+title,answers)}><FileText size={15}/>Read answers <ArrowRight size={15}/></button></article>)}</div>
   <div className="faction-findings">{profile.findings.map((finding,i)=>{const refs=finding.refs.filter(ref=>byRef.has(ref)),n=refs.filter(ref=>byRef.get(ref).assignment.kind==='mention').length;return <article className="card faction-finding" key={finding.title}><span className="syn-number">{String(i+1).padStart(2,'0')}</span><div><h4>{finding.title}</h4><p>{finding.body}</p><div className="faction-finding-evidence"><button className="syn-evidence-link" disabled={!refs.length} onClick={()=>open(finding.title,refs.map(ref=>byRef.get(ref)))}><FileText size={15}/>Read {refs.length} supporting answer{refs.length===1?'':'s'} <ArrowRight size={15}/></button><span>{n} named · {refs.length-n} contextual</span></div></div></article>;})}</div>
   <button className="button" onClick={()=>open(faction+' · all linked answers',sources)}>Browse all {sources.length} linked answers <ArrowRight size={15}/></button>
  </>}
  <details className="card faction-review-method"><summary>Method & scope</summary><p>All {review.reviewedDocuments} coded answer documents were read for this edition. An answer can discuss several factions and appear in several profiles. Counts refer to answer documents, including passing mentions, rather than distinct writers or agreement with a claim.</p><p>Each answer is counted once per faction. An explicit name or shorthand goes in the first group; implicit references go in the second. A general comment is not assigned merely because the writer selected that main faction. Main-faction values are used privately to resolve the subject; respondent profiles and links between their different answers are not published.</p><p>Each finding summarises the faction-specific passages in its linked answers. Several answers discuss other factions too. These summaries cover the {report.edition} answers, prepared with Codex and checked against the topic codings. They describe respondent views; claims about rules, design intent or misconduct have not been independently investigated.</p><p>The answer codings and summaries are saved separately. Rebuilding checks the source references and wording. The survey is closed and these sources are fixed.</p></details>
  {evidence&&<EvidenceDialog spec={evidence} documents={docs.filter(d=>evidence.refs.includes(d.ref))} topics={report.topics} onClose={()=>setEvidence(null)}/>}
 </section>;
}
