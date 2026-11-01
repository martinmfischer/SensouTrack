import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,Download,RefreshCw} from 'lucide-react';
import {Card,StrengthChart,Factions,Themes,Matchups,Timeline,Satisfaction,Representation,FactionDetail} from './charts.jsx';
import HubNavigation,{surveyViews} from '../src/hub-navigation.jsx';
import PerceptionExplorer from './PerceptionExplorer.jsx';
import CrossReferences from './CrossReferences.jsx';
import WrittenResponsesPage from './WrittenResponsesPage.jsx';
import {surveyPage} from './written-response-routes.mjs';
import './cross-styles.css';
import './exploration.css';
import {FACTIONS,SHORT} from './analysis.mjs';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './styles.css';
import './sensou.css';
import './public.css';
import './synthesis.css';
const number=v=>v==null?'—':v.toLocaleString('en-GB',{maximumFractionDigits:2});
const tabs=surveyViews;
function PublicSurvey(){
  const [data,setData]=useState(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[page,setPage]=useState(tabs.some(t=>t[0]===surveyPage(location.hash))?surveyPage(location.hash):'overview'),[selected,setSelected]=useState(null),[groups,setGroups]=useState([]),[cohort,setCohort]=useState(''),[minN,setMinN]=useState(5),[loading,setLoading]=useState(true),[whole,setWhole]=useState(null),[texts,setTexts]=useState(null),[publication,setPublication]=useState(null);
  const [loadedCohort,setLoadedCohort]=useState(null);
  useEffect(()=>{const c=new AbortController();setError(false);setLoading(true);
    const get=async path=>{const r=await fetch('https://zwybedqlxxjtznneicdb.supabase.co/storage/v1/object/public/sensou-survey/'+path.slice('/survey/'.length),{credentials:'omit',cache:'no-store',signal:c.signal});if(!r.ok)throw Error();return r.json();};
    (async()=>{const meta=await get('/survey/publication.json');
      if(meta.schema!==1||!Number.isFinite(Date.parse(meta.refreshedAt))||!Number.isInteger(meta.total)||!/^\/survey\/(?:releases\/[a-zA-Z0-9-]+\/)?$/.test(meta.base))throw Error();
      const base=meta.base,m=await get(base+'groups.json');if(!Array.isArray(m.groups))throw Error();if(cohort&&!m.groups.some(g=>g.id===cohort)){setCohort('');return;}const all=get(base+'summary.json');
      const [d,w,t]=await Promise.all([cohort?get(base+'groups/'+cohort+'.json'):all,all,get(base+'texts.json')]);
      if(d.schema!==1||!d.analysis||!Array.isArray(m.groups)||t.schema!==1||!Array.isArray(t.texts))throw Error();
      if(!c.signal.aborted){setData(d);setLoadedCohort(cohort);setGroups(m.groups);setWhole(w);setTexts(t);setPublication(meta);}
    })().catch(e=>{if(e.name!=='AbortError')setError(true);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();
  },[retry,cohort]);
  useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')setRetry(n=>n+1);};const timer=setInterval(refresh,300000);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};},[]);
  useEffect(()=>{const h=()=>{const p=surveyPage(location.hash);if(p==='survey-main')return;setPage(tabs.some(t=>t[0]===p)?p:'overview');};addEventListener('hashchange',h);return()=>removeEventListener('hashchange',h);},[]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[page]);
  const rows=data?.factions||[];
  const top=data?.factions.filter(f=>f.mean!=null).sort((a,b)=>b.mean-a.mean)[0];
  function download(){const csv=[['Faction','Perceived strength mean','Median','Ratings n','Strongest nominations','Weakest nominations','Data type','Snapshot'],...rows.map(f=>[f.name,f.mean??'',f.median??'',f.n??'',f.strongest??'',f.weakest??'','Community perception survey',data.snapshotDay])].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const u=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='sensou-survey-aggregate.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  return <><HubNavigation survey page={page}/><div className="hub-page public-survey"><a className="survey-skip" href="#survey-main" onClick={e=>{e.preventDefault();const main=document.getElementById("survey-main");main.focus();main.scrollIntoView();}}>Skip to content</a>
    <main id="survey-main" tabIndex={-1} className="survey-content"><div className="page-header"><div><div className="eyebrow">BUSHIDO / COMMUNITY PERCEPTION SURVEY · 2026</div><h1>{({overview:"The meta, through players’ eyes.",factions:"How strong does each faction feel?",explore:"Explore the ratings.",cross:"Who sees the meta differently?",themes:"The themes behind the factions.",matchups:"How do players perceive the matchups?",comments:"Written responses.",data:"The data behind the dashboard."})[page]}</h1><p>{page==='comments'?'Detailed readings, linked answers and recurring topics.':'Player ratings, theme nominations and matchup views.'}</p></div><a className="button primary" href="https://tally.so/r/2jEY7L" target="_blank" rel="noreferrer">Take the survey <ArrowUpRight size={15}/></a></div>

    {page!=='comments'&&<section className="filterbar public-filterbar" aria-label="Filter survey data"><label><span>Respondent group</span><select aria-label="Survey respondent group" value={cohort} onChange={e=>setCohort(e.target.value)}><option value="">All respondents</option>{groups.map(g=><option key={g.id} value={g.id}>{g.label} · n {g.n}</option>)}</select></label><label><span>Highlight n below</span><select aria-label="Small sample threshold" value={minN} onChange={e=>setMinN(Number(e.target.value))}>{[5,10,20].map(n=><option key={n}>{n}</option>)}</select></label>{cohort&&<button className="text-button" onClick={()=>setCohort('')}>Reset group</button>}<button className="button secondary" disabled={loading} onClick={()=>setRetry(n=>n+1)}><RefreshCw size={14}/>Refresh</button><button className="button secondary" disabled={!data||loading} onClick={download}><Download size={14}/>Faction CSV</button></section>}
    {error&&(!data||loadedCohort!==cohort)?<div className="card" role="alert">Survey results are temporarily unavailable. <button className="text-button" onClick={()=>setRetry(n=>n+1)}>Retry</button></div>:!data||loadedCohort!==cohort?<div className="card" role="status">Loading survey results…</div>:<>{error&&<div className="card" role="alert">The update failed. Showing the last successful publication. <button className="text-button" onClick={()=>setRetry(n=>n+1)}>Retry</button></div>}<div className="selection-line"><span><b>{page==='comments'?(whole||data).total:data.total}</b> completed submissions{page==='comments'?' · whole survey':cohort?' in this group':' · main survey'}</span><span className="publication-status"><time dateTime={publication?.refreshedAt}>{new Date(publication?.refreshedAt||data.snapshotDay).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}</time> · {publication?.mode==='hourly'?'Hourly API sync':'Published data'}{Date.now()-Date.parse(publication?.refreshedAt||data.snapshotDay)>86400000&&<b className="stale-data">Update overdue</b>}</span></div>
    {page==='overview'&&<><div className="kpi-grid"><div className="kpi"><div>COMPLETED RESPONSES</div><strong>{data.total}</strong><p>Player responses</p></div><div className="kpi"><div>META SATISFACTION</div><strong>{number(data.satisfaction.mean)}<small>/ 7</small></strong><p>{number(data.satisfaction.n)} valid ratings</p></div><div className="kpi"><div>HIGHEST PERCEIVED STRENGTH</div><strong className="kpi-faction">{top?SHORT[FACTIONS.indexOf(top.name)]:'—'}</strong><p>{number(top?.mean)} / 7 · n = {number(top?.n)}</p></div><div className="kpi"><div>MAIN FACTIONS SHOWN</div><strong>{data.factions.filter(f=>f.owners>0).length}<small>/ 15</small></strong><p>Groups with at least 5 respondents</p></div></div><Card title="How strong does each faction feel?" eyebrow="COMMUNITY PERCEPTIONS · 1–7 SCALE"><StrengthChart data={data.factions} minN={minN} onSelect={setSelected}/></Card><div className="two-col"><Card title="Survey participation">{data.analysis.summary.days.length?<Timeline days={data.analysis.summary.days}/>:<p className="muted">Daily counts are not published for this selection.</p>}</Card><Card title="How does the meta feel?"><Satisfaction s={data.satisfaction}/></Card></div><Card title="Who took part?"><Representation a={data.analysis.summary}/></Card></>}
    {page==='factions'&&<Factions a={data.analysis.summary} minN={minN} onSelect={setSelected}/>}
    {page==='explore'&&<PerceptionExplorer minN={minN} publicData={data.analysis}/>}
    {page==='cross'&&<CrossReferences minN={minN} publicData={data.analysis} onCohort={(by,name)=>{const label=(by==='experience'?'Experience: ':'Main faction: ')+name;const group=groups.find(g=>g.label===label);if(group)setCohort(group.id);}}/>}
    {page==='themes'&&<Themes a={data.analysis.summary}/>}
    {page==='matchups'&&<Matchups a={data.analysis.summary} minN={minN}/>}
    {page==='comments'&&<WrittenResponsesPage texts={texts} publicMode/>}
    {page==='data'&&<Card title="Data quality and public access" eyebrow="MAIN SURVEY · 2jEY7L"><div className="quality-kpis"><div><b>{data.total}</b><span>submissions in this group</span></div><div><b>{number(data.analysis.summary.flagged)}</b><span>quality-flagged responses</span></div><div><b>{number(data.analysis.summary.repeatRespondents)}</b><span>repeat browser submissions</span></div></div><p>The public dashboard includes faction ratings, group filters and reviewed written answers. Individual numeric responses are omitted. Public groups need at least five responses; matchup rows use a five-player minimum.</p></Card>}
    {(page==='data'||page==='overview')&&<Card title="About this snapshot" eyebrow="DATA & METHODS"><p>This snapshot covers the main survey (2jEY7L). Faction strength and satisfaction use valid 1–7 ratings. “Not enough experience” and blank answers are excluded. Mean ratings give each faction equal weight.</p><p>Public results show grouped statistics and reviewed written answers. Respondent IDs and individual numeric answers are omitted. Groups under five are hidden; matchup rows need five responses. Reviewed texts have no numeric-response profile.</p><p>{publication?.mode==='hourly'?'Numeric results refresh hourly from the Tally API.':'This publication was refreshed from the Tally API.'} This page checks for updates every five minutes. New written answers appear after privacy review.</p></Card>}</>}
    <footer className="page-footer"><span>SENSOU / META SURVEY</span><div><a href="/">Game Meta</a> · <a href="/impressum.html">Legal notice</a> · <a href="/privacy.html">Privacy</a></div></footer></main>
    {selected&&data&&<FactionDetail name={selected} a={data.analysis.summary} minN={minN} onClose={()=>setSelected(null)}/>}</div></>;
}
createRoot(document.getElementById('root')).render(<PublicSurvey/>);
