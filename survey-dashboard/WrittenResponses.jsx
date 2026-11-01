import React,{useMemo,useState} from 'react';
import {ArrowDownToLine,Check,ChevronRight,Search,Tags,X} from 'lucide-react';
import {analyzeTopics,commentMatchesTerm,topicCsv,TOPIC_RULES} from './text-topics.mjs';
import './text-topics.css';

const QUESTIONS={'Meta':'Biggest meta problems','Themes':'Why themes feel strong or weak','Faction & Matchups':'Own faction & matchups'};
const people=comments=>new Set(comments.map(c=>c.id)).size;
const percent=(n,d)=>d?Math.round(n/d*100)+'%':'—';
function exportTopics(result,question,publicMode){
  const csv=topicCsv(result,question),url=URL.createObjectURL(new Blob([publicMode?csv.replaceAll('Respondents','Answer documents').replaceAll('respondents','answer documents'):csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='sensou-perception-topics.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export default function WrittenResponses({a,initialQuestion='Meta',publicMode=false}){
  const [question,setQuestion]=useState(initialQuestion),[selected,setSelected]=useState(''),[query,setQuery]=useState(''),[term,setTerm]=useState(''),[minimum,setMinimum]=useState(2);
  const corpus=useMemo(()=>a.comments.filter(c=>!question||c.type===question),[a.comments,question]);
  const result=useMemo(()=>analyzeTopics(corpus,{minPeople:minimum}),[corpus,minimum]);
  const topic=result.topics.find(t=>t.id===selected),unmatched=selected==='unmatched';
  const selection=topic?topic.members:unmatched?result.unassigned:corpus;
  const shown=selection.filter(c=>(!term||commentMatchesTerm(c,term))&&c.text.toLowerCase().includes(query.toLowerCase()));
  function clear(){setSelected('');setTerm('');}
  return <div className="topic-browser">
    <section className="card topic-browser-controls"><div className="card-heading"><div><div className="eyebrow">BROWSE THE ANSWERS</div><h2>Topic explorer</h2></div><span className="badge"><Tags size={12}/> Keyword matches</span></div>
      <div className="topic-controls"><label><span>Open question</span><select aria-label="Question for topic summary" value={question} onChange={e=>{setQuestion(e.target.value);clear();setQuery('');}}>{Object.entries(QUESTIONS).map(([id,label])=><option value={id} key={id}>{label}</option>)}<option value="">All three questions</option></select></label><label><span>Minimum topic count</span><select aria-label="Minimum respondents per topic" value={minimum} onChange={e=>{setMinimum(Number(e.target.value));clear();}}>{[1,2,3,5].map(n=><option value={n} key={n}>At least {n} {publicMode?(n===1?'answer':'answers'):(n===1?'respondent':'respondents')}</option>)}</select></label><button className="button secondary" disabled={!result.topics.length} onClick={()=>exportTopics(result,question?QUESTIONS[question]:'All three questions',publicMode)}><ArrowDownToLine size={14}/> Topic CSV</button></div>
      <p className="topic-counts">{result.answers} answers · {result.groupedAnswers} with a keyword match · {result.unassigned.length} without a match</p>
    </section>
    <div className="topic-explorer">
      <section className="card topic-browser-topics"><h3>Topics</h3><div className="topic-bars">{result.topics.map(t=><button key={t.id} className={'topic-bar '+(topic?.id===t.id?'selected':'')} aria-pressed={topic?.id===t.id} onClick={()=>{setSelected(t.id===selected?'':t.id);setTerm('');}}><div><b>{t.label}</b><span>{t.respondents}<small>{percent(t.respondents,result.respondents)}</small></span></div><i><em style={{width:percent(t.respondents,result.respondents)}}/></i></button>)}{!result.topics.length&&<p className="topic-empty">No topics at this minimum. Lower it to show more.</p>}</div>
        <p className="topic-denominator">Share of {result.respondents} {publicMode?'answer documents':'respondents with text'}. Topics overlap.</p>
        <button className={'topic-unmatched '+(unmatched?'selected':'')} onClick={()=>{setSelected(unmatched?'':'unmatched');setTerm('');}} aria-pressed={unmatched}><span>Without a topic match</span><b>{result.unassigned.length}</b><ChevronRight size={15}/></button>
        <details className="topic-word-details"><summary>Recurring words</summary><div className="word-discovery">{result.terms.slice(0,20).map(t=><button key={t.term} className={'word-chip '+(term===t.term?'selected':'')} aria-pressed={term===t.term} onClick={()=>{setTerm(term===t.term?'':t.term);setSelected('');}}><span>{t.label}</span><b>{t.respondents}</b></button>)}{!result.terms.length&&<p className="topic-empty">No recurring words found.</p>}</div></details>
      </section>
      <section className="card topic-answer-list"><div className="card-heading"><h3>Answers</h3><span className="badge">{shown.length} of {result.answers}{!publicMode&&<> · {people(shown)} respondents</>}</span></div>
        <label className="search"><Search size={16}/><input aria-label="Search written responses" placeholder="Search these answers…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
        {(topic||unmatched||term)&&<div className="active-topic-filter"><Check size={14}/><span>{topic?.label||(unmatched?'Without a topic match':result.terms.find(t=>t.term===term)?.label||term)}</span><button className="icon-button" aria-label="Clear topic filter" onClick={clear}><X size={14}/></button></div>}
        <div className="comment-grid">{shown.map(c=><article className="comment" key={c.id+c.type}><div><span className="badge">{QUESTIONS[c.type]}</span>{!publicMode&&<small>{c.date}</small>}</div><p>{c.text}</p>{publicMode?(c.edited&&<footer>Identifying passages removed or marked.</footer>):<footer>{c.faction||'No main faction'}<span>· {c.experience||'Experience not provided'}</span></footer>}</article>)}</div>
        {!shown.length&&<div className="empty">No matching answers.{(query||topic||unmatched||term)&&<button className="text-button" onClick={()=>{clear();setQuery('');}}>Clear search and filters</button>}</div>}
      </section>
    </div>
    <details className="card topic-method"><summary>Keyword method & matching rules</summary><p>Fixed keywords group answers for browsing. Each {publicMode?'answer document':'respondent'} counts once per topic; topics can overlap. The minimum count controls which topics appear. Search filters the answer list.</p><ul>{TOPIC_RULES.map(t=><li key={t.id}><b>{t.label}</b><span>{t.words.join(' · ')}</span></li>)}</ul><p>Matching ignores case, normalises punctuation and uses whole words or phrases. Recurring words combine common spelling variants.{publicMode?' Only reviewed texts are shown; identifying edits are marked.':' Global filters apply.'}</p></details>
  </div>;
}
