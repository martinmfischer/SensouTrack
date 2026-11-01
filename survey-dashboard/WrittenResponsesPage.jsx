import React,{useEffect,useState} from 'react';
import {BookOpen,Layers3,Users} from 'lucide-react';
import {FACTIONS} from './analysis.mjs';
import SynthesisReport from './SynthesisReport.jsx';
import WrittenResponses from './WrittenResponses.jsx';
import {factionSlug,writtenResponseRoute} from './written-response-routes.mjs';
import './written-responses.css';

function FactionSynthesis({slug}){
  const faction=FACTIONS.find(name=>factionSlug(name)===slug)||FACTIONS[0];
  return <section className="faction-synthesis">
    <div className="card faction-synthesis-intro"><div className="eyebrow">TEXT SYNTHESIS / MAIN FACTION</div><div className="faction-synthesis-heading"><h2>From the faction’s perspective</h2><span className="badge">In preparation</span></div><p>A detailed reading of answers grouped by players’ main faction.</p><label><span>Players’ main faction</span><select aria-label="Main faction for written analysis" value={factionSlug(faction)} onChange={e=>{location.hash='comments/factions/'+e.target.value;}}>{FACTIONS.map(name=><option key={name} value={factionSlug(name)}>{name}</option>)}</select></label></div>
    <div className="faction-synthesis-title"><h3>{faction}</h3><p>Analysis not published yet.</p></div>
    <div className="faction-synthesis-outline">{[
      ['01','Key themes','Recurring concerns, agreements and contrasting views.'],
      ['02','Meta & balance','How these players describe the wider game.'],
      ['03','Themes & list building','Choices within the faction and reasons for taking a theme.'],
      ['04','Matchups & counterplay','Difficult opponents, available tools and possible responses.'],
      ['05','Source answers','Linked, reviewed answers supporting the analysis.'],
    ].map(([number,title,description])=><section className="card" key={number}><span className="eyebrow">{number}</span><h4>{title}</h4><p>{description}</p></section>)}</div>
  </section>;
}

export default function WrittenResponsesPage({a,initialQuestion,publicMode=false,texts,sourceVersion,requestRevision}){
  const [hash,setHash]=useState(location.hash);
  useEffect(()=>{const update=()=>setHash(location.hash);addEventListener('hashchange',update);return()=>removeEventListener('hashchange',update);},[]);
  const route=writtenResponseRoute(hash)||{view:'synthesis'};
  return <div className="written-responses-page">
    <nav className="written-response-tabs" aria-label="Written response views">{[
      ['synthesis','Synthesis','#comments',BookOpen],
      ['topics','Topic explorer','#comments/topics',Layers3],
      ['factions','By main faction','#comments/factions',Users],
    ].map(([id,label,href,Icon])=><a key={id} href={href} aria-current={route.view===id?'page':undefined}><Icon size={16}/>{label}</a>)}</nav>
    {route.view==='synthesis'&&<SynthesisReport texts={texts} sourceVersion={sourceVersion}/>}
    {route.view==='topics'&&(publicMode&&!texts?<section className="card" role="status">Loading reviewed answers…</section>:<WrittenResponses key={requestRevision} a={publicMode?{comments:texts.texts}:a} initialQuestion={initialQuestion} publicMode={publicMode}/>)}
    {route.view==='factions'&&<FactionSynthesis slug={route.faction}/>}
  </div>;
}
