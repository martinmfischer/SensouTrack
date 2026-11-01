import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,BarChart3,Download,Filter,Plus,Shield,Swords} from 'lucide-react';
import {Meta,Icon,Select} from './meta';
import {factions,scenarios,filterGames,csv,localDate} from './domain';
import {publicGames} from './public-games.mjs';
import {useAdvertising} from './advertising';
import HubNavigation from './hub-navigation';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './styles.css';
import './public-meta.css';

const accountApp='https://sensoutrack.the-zj.workers.dev/';
function PublicMeta(){
  const advertising=useAdvertising();
  const [games,setGames]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const [filters,setFilters]=useState({days:'90',faction:'',scenario:'',rice:'100',format:''});
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    publicGames(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,controller.signal)
      .then(setGames).catch(e=>{if(e.name!=='AbortError')setError('Community results are temporarily unavailable. Please try again.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[refresh]);
  const filtered=useMemo(()=>filterGames(games,filters),[games,filters]);
  const update=(key,value)=>setFilters(f=>({...f,[key]:value}));
  const report=()=>location.assign(accountApp+'#report');
  function download(){
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv(filtered)],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download=`sensou-community-${localDate()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <><HubNavigation/><div className="hub-page"><div className="public-meta app-shell"><a href="#main" className="skip-link">Skip to content</a>
    <header className="public-header"><a className="brand" href="/" aria-label="Sensou home"><span className="brand-symbol" aria-hidden="true"><span className="brand-kanji">戦</span></span><span>sensou<span className="brand-period">.</span><small>BUSHIDO GAME TRACKER</small></span></a><nav aria-label="Main navigation"><a href="#main"><BarChart3 size={16}/>Community meta</a><a href={accountApp+'#games'}>My games<ArrowUpRight size={14}/></a><a className="button primary compact" href={accountApp+'#report'}><Plus size={16}/>Report game</a></nav></header>
    <nav className="source-switch" aria-label="Meta source"><a href="/" aria-current="page">Game Meta</a><a href="/survey/">Meta Survey</a></nav>
    <main id="main" tabIndex={-1}>
      <div className="page-heading"><div><span className="eyebrow"><span className="tiny-line"/>BUSHIDO / RISEN SUN</span><h1>The state of the <span>Jwar Isles.</span></h1><span className="battle-seal" aria-hidden="true">戦</span><p>Faction win rates, themes and head-to-head results.</p></div><div className="heading-action"><span className="data-stamp"><span className="status-dot"/>PLAYER REPORTED</span><small>Real community games · updated on page load</small></div></div>
      <div className="filterbar"><div className="filter-label"><Icon icon={Filter} size={15}/><span>Explore</span></div>
        <Select label="Date range" value={filters.days} onChange={v=>update('days',v)}><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option><option value="">All time</option></Select>
        <Select label="Faction filter" value={filters.faction} onChange={v=>update('faction',v)}><option value="">All factions</option>{factions.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Select>
        <Select label="Scenario filter" value={filters.scenario} onChange={v=>update('scenario',v)}><option value="">All scenarios</option>{scenarios.map(s=><option key={s}>{s}</option>)}</Select>
        <Select label="Rice filter" value={filters.rice} onChange={v=>update('rice',v)}><option value="">All Rice sizes</option>{[50,75,100].map(n=><option key={n} value={n}>{n} Rice</option>)}</Select>
        <Select label="Game type filter" value={filters.format} onChange={v=>update('format',v)}><option value="">All game types</option><option>Casual</option><option>Tournament</option></Select>
        <button className="icon-button export-button" onClick={download} disabled={loading||!!error} aria-label="Export filtered games as CSV"><Download size={18}/></button>
      </div>
      {error?<div className="error-box" role="alert">{error}<button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Retry</button></div>:loading?<div className="loading-state" role="status">Gathering the latest battles…</div>:<Meta games={filtered} source="live" onReport={report} onFaction={id=>update('faction',id)}/>}
      {advertising.unit}
      <section className="panel public-explainer" id="about"><span className="eyebrow">ABOUT THE NUMBERS</span><h2>Battle reports, shared perspective.</h2><p>Sensou is a community battle journal for Bushido: Risen Sun. Each report records both warbands, themes, scenario, game size and victory points. Report each battle once, by one player.</p><p>Win rate is wins divided by games. Draws count as non-wins. Faction mirrors are excluded from faction statistics and matchups; identical faction and theme mirrors are excluded from theme comparisons. Every matchup shows its sample size. “—” means no data or a sample below the selected minimum, never a zero win rate.</p><p>Results are self-reported. Player skill, repeat opponents and who chooses to report can affect the figures.</p><p>The faction and theme catalogue follows a JwarCards snapshot from 23 October 2026. Check recruitment restrictions and the current <a href="https://gctstudios.com/pages/rules-resources" rel="noreferrer" target="_blank">GCT Studios rules and tournament resources</a> for legality. Bushido belongs to GCT Studios; Sensou is an independent community project.</p></section>
      <section className="panel public-explainer" id="privacy"><span className="eyebrow">PRIVACY</span><h2>Public results. Separate player accounts.</h2><p>This page reads the public game projection from Supabase. It displays game details without player names, email addresses or private notes. Reporting, sign-in and your private journal are on the separate account app.</p><p>{import.meta.env.VITE_ADSENSE_ACTIVE===true?"This page uses Google to manage advertising consent. Ads are not requested without suitable consent.":"No advertising or analytics scripts are loaded on this page at present."} Cloudflare serves the website and Supabase serves public results; requests send network information such as your IP address to those providers. This page does not store an account session or read your account app’s storage.</p><p><a href={accountApp+'#games'}>Open your player account<ArrowUpRight size={13}/></a></p></section>
    </main><footer><span>sensou<span className="brand-period">.</span> / An independent Bushido community project.</span><div><a href="#about">How the statistics work</a><a href="/impressum.html">Legal notice</a><a href="/privacy.html">Privacy</a>{advertising.privacyControl}</div></footer>
  </div></div></>;
}
createRoot(document.getElementById('root')).render(<PublicMeta/>);
