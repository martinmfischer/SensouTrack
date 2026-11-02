import React,{useEffect,useState} from 'react';
import {BookOpen,Layers3,Users} from 'lucide-react';
import FactionSynthesis from './FactionSynthesis.jsx';
import SynthesisReport from './SynthesisReport.jsx';
import WrittenResponses from './WrittenResponses.jsx';
import {writtenResponseRoute} from './written-response-routes.mjs';
import './written-responses.css';

export default function WrittenResponsesPage({a,initialQuestion,publicMode=false,texts,sourceVersion,requestRevision}){
  const [hash,setHash]=useState(location.hash);
  useEffect(()=>{const update=()=>setHash(location.hash);addEventListener('hashchange',update);return()=>removeEventListener('hashchange',update);},[]);
  const route=writtenResponseRoute(hash)||{view:'synthesis'};
  return <div className="written-responses-page">
    <nav className="written-response-tabs" aria-label="Written response views">{[
      ['synthesis','Synthesis','#comments',BookOpen],
      ['topics','Topic explorer','#comments/topics',Layers3],
      ['factions','By faction','#comments/factions',Users],
    ].map(([id,label,href,Icon])=><a key={id} href={href} aria-current={route.view===id?'page':undefined}><Icon size={16}/>{label}</a>)}</nav>
    {route.view==='synthesis'&&<SynthesisReport texts={texts} sourceVersion={sourceVersion}/>}
    {route.view==='topics'&&(publicMode&&!texts?<section className="card" role="status">Loading reviewed answers…</section>:<WrittenResponses key={requestRevision} a={publicMode?{comments:texts.texts}:a} initialQuestion={initialQuestion} publicMode={publicMode}/>)}
    {route.view==='factions'&&<FactionSynthesis slug={route.faction} texts={texts} sourceVersion={sourceVersion}/>}
  </div>;
}
