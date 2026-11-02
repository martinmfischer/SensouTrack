import React,{useState,useEffect} from 'react';
import {ArrowUpRight,BarChart3,Calculator,Database,Eye,Filter,Layers3,Menu,MessageSquare,Swords,X} from 'lucide-react';
import {statsOrigin,accountOrigin,calculatorOrigin} from './site-links.mjs';
import './hub-navigation.css';
export const surveyViews=[['overview','Overview',BarChart3],['factions','Factions',Layers3],['explore','Explore perceptions',Eye],['cross','Cross-analysis',Filter],['themes','Themes',Layers3],['matchups','Matchups',Swords],['comments','Written responses',MessageSquare],['data','Data & methods',Database]];
export function MainSiteLinks({current,onStats,onReport,onNavigate=()=>{}}){
  return <nav className="hub-source-nav site-main-nav" aria-label="Main sections">
    <a href={onStats?'#meta':statsOrigin+'/'} aria-current={current==='stats'?'page':undefined} onClick={e=>{onNavigate();if(onStats){e.preventDefault();onStats();}}}><BarChart3 size={17}/>Game Stats</a>
    <a href={statsOrigin+'/survey/'} aria-current={current==='survey'?'page':undefined} onClick={onNavigate}><Eye size={17}/>Meta Survey</a>
    <a href={accountOrigin+'/#report'} aria-current={current==='report'?'page':undefined} onClick={e=>{onNavigate();if(onReport){e.preventDefault();onReport();}}}><Swords size={17}/>Report a Game</a>
    <a href={calculatorOrigin+'/'} onClick={onNavigate}><Calculator size={17}/>SensouCalc</a>
  </nav>;
}
export default function HubNavigation({survey=false,page=''}){
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const mq=matchMedia('(max-width:700px)');if(!open||!mq.matches)return;
    const main=document.querySelector('.hub-page'),aside=document.getElementById('hub-navigation'),trigger=document.querySelector('.hub-mobile button'),overflow=document.body.style.overflow;
    if(main)main.inert=true;document.body.style.overflow='hidden';
    const links=[...aside.querySelectorAll('a[href],button')];links[0]?.focus();
    const close=e=>{if(e.key==='Escape'){setOpen(false);trigger?.focus();}else if(e.key==='Tab'){const items=[trigger,...links].filter(Boolean),i=items.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&(i===items.length-1||i<0)){e.preventDefault();items[0]?.focus();}}};
    const resize=()=>setOpen(false);mq.addEventListener('change',resize);document.addEventListener('keydown',close);
    return()=>{if(main)main.inert=false;document.body.style.overflow=overflow;document.removeEventListener('keydown',close);mq.removeEventListener('change',resize);};
  },[open]);
  return <><header className="hub-mobile"><a href="/">戦 <b>sensou.</b></a><button aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="hub-navigation" onClick={()=>setOpen(v=>!v)}>{open?<X size={21}/>:<Menu size={21}/>}</button></header>
  {open&&<button className="hub-shade" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
  <aside id="hub-navigation" className={'hub-sidebar '+(open?'is-open':'')}><a className="hub-brand" href="/" aria-label="Sensou home"><span>戦</span><b>sensou<i>.</i><small>BUSHIDO / COMMUNITY</small></b></a>
    <span className="hub-nav-label">BUSHIDO COMMUNITY</span><MainSiteLinks current={survey?'survey':'stats'} onNavigate={()=>setOpen(false)}/>
    {survey&&<><span className="hub-nav-label">SURVEY DASHBOARD</span><nav className="hub-section-nav" aria-label="Survey views">{surveyViews.map(([id,label,Icon])=><a key={id} href={'#'+id} aria-current={page===id?'page':undefined} onClick={()=>setOpen(false)}><Icon size={16}/>{label}</a>)}</nav></>}
    <div className="hub-nav-card"><span className="hub-nav-label">COMMUNITY / 2026</span><h3>Bushido,<br/>by the numbers.</h3><p>{survey?'Faction ratings, themes and matchup views.':'Record your games and compare faction win rates.'}</p>{survey?<span className="survey-closed-label">Survey closed</span>:<a href="https://app.sensoutrack.pages.dev/#report">Report a game<ArrowUpRight size={14}/></a>}</div>
    <nav className="hub-bottom-nav" aria-label="Player and legal links"><a href={accountOrigin+'/#games'}>My games <ArrowUpRight size={13}/></a><div><a href="/impressum.html">Legal notice</a><a href="/privacy.html">Privacy</a></div></nav>
  </aside></>;
}
