import React,{useEffect,useMemo,useState} from 'react';
import {ArrowLeftRight,ArrowRight,Eye,MessageSquare,RotateCcw} from 'lucide-react';
import {FACTIONS,SHORT,matchesOpinions,factionBaseline} from './analysis.mjs';
import {RatingGuideCaption} from './RatingGuides.jsx';
import {consensus,pairedDuel,reciprocalMatchup,coNominations,wilsonInterval} from './exploration.mjs';
import {FACTION_COLORS,PERCEPTION_SCALE} from './palette.mjs';
import {RangeFields,RangeHistogram} from './OpinionFilters.jsx';
import {publicDuel,publicReciprocal,publicNetworkCount} from './public-analysis.mjs';

const number=(v,d=1)=>v==null?'—':v.toLocaleString('en-GB',{minimumFractionDigits:d,maximumFractionDigits:d});
const percent=(n,d)=>n==null?'—':d?Math.round(n/d*100)+'%':'—';
const short=name=>SHORT[FACTIONS.indexOf(name)]||name;
function Panel({title,eyebrow,action,children,className=''}){return <section className={'card explorer-panel '+className}><div className="card-heading"><div><div className="eyebrow">{eyebrow||'COMMUNITY PERCEPTIONS'}</div><h2>{title}</h2></div>{action}</div>{children}</section>;}
function Help({children}){return <p className="explorer-help">{children}</p>;}
function PairPicker({pair,onChange,label}){return <div className="pair-picker"><label>Faction A<select aria-label={label+' faction A'} value={pair.a} onChange={e=>onChange({a:e.target.value,b:e.target.value===pair.b?FACTIONS.find(f=>f!==e.target.value):pair.b})}>{FACTIONS.map(f=><option key={f}>{f}</option>)}</select></label><button className="icon-button" aria-label={'Swap '+label.toLowerCase()+' factions'} onClick={()=>onChange({a:pair.b,b:pair.a})}><ArrowLeftRight size={18}/></button><label>Faction B<select aria-label={label+' faction B'} value={pair.b} onChange={e=>onChange({...pair,b:e.target.value})}>{FACTIONS.filter(f=>f!==pair.a).map(f=><option key={f}>{f}</option>)}</select></label></div>;}
function OutcomeRows({rows,n,onChoose,readable=true}){return <div className="outcome-rows">{rows.map(r=><button key={r.key} disabled={!readable||!r.count} onClick={()=>onChoose(r.key)} title={(readable?'Read answers from this group: ':'Published aggregate: ')+(r.count??'withheld')}><span>{r.label}</span><i><em style={{width:n?r.count/n*100+'%':'0%',background:r.color}}/></i><b>{r.count??"—"}<small>{percent(r.count,n)}</small></b></button>)}</div>;}

function ConsensusMap({records,minN,rules,onApply,onRead,publicData}){
  const [selected,setSelected]=useState('Temple of Ro-Kan'),[range,setRange]=useState({min:6,max:7});
  const stats=useMemo(()=>publicData?.consensus||consensus(records),[records,publicData]),current=stats.find(f=>f.name===selected),active=rules.find(r=>r.kind==='rating'&&r.faction===selected);
  const baseline=factionBaseline(stats);
  useEffect(()=>setRange(active?{min:active.min,max:active.max}:{min:6,max:7}),[selected,active?.min,active?.max]);
  const rule={kind:'rating',faction:selected,...range},groupN=publicData?current.distribution.reduce((n,v,i)=>n+(i+1>=range.min&&i+1<=range.max?v:0),0):records.filter(r=>matchesOpinions(r,[rule])).length;
  const points=stats.filter(f=>f.spread!==null),x=v=>65+(v-1)/6*625,y=v=>330-v/3*265;
  const activate=(event,name)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(name);}};
  return <><Panel title="Strength perception & disagreement" eyebrow="CONSENSUS MAP · OBSERVED RATINGS" action={<select aria-label="Consensus map faction" value={selected} onChange={e=>setSelected(e.target.value)}>{FACTIONS.map(f=><option key={f}>{f}</option>)}</select>}>
    <svg className="consensus-map" viewBox="0 0 760 400" role="group" aria-label="Perceived mean strength versus spread of ratings">
      {[0,1,2,3].map(v=><g key={v}><line x1="65" x2="690" y1={y(v)} y2={y(v)} stroke="#e2e9d9" strokeDasharray="4 4"/><text x="52" y={y(v)+4} textAnchor="end">{v}</text></g>)}
      {[1,2,3,4,5,6,7].map(v=><g key={v}><line x1={x(v)} x2={x(v)} y1="65" y2="330" stroke="#edf1e6"/><text x={x(v)} y="351" textAnchor="middle">{v}</text></g>)}
      {baseline.value!==null&&<line className="power-baseline" x1={x(baseline.value)} x2={x(baseline.value)} y1="65" y2="330"><title>Average perceived faction strength: {number(baseline.value,2)} · equal faction weight</title></line>}
      <text x="65" y="28">More spread = more disagreement (SD)</text><text x="375" y="384" textAnchor="middle">Mean perceived strength · 1–7</text>
      {points.filter(f=>f.name!==selected).concat(points.filter(f=>f.name===selected)).map(f=><g role="button" tabIndex="0" aria-label={'Select consensus faction '+f.name} key={f.name} onClick={()=>setSelected(f.name)} onKeyDown={e=>activate(e,f.name)} className="consensus-point"><title>{f.name}: perceived mean {number(f.mean)}, spread {number(f.spread,2)}, n = {f.n}</title><circle cx={x(f.mean)} cy={y(f.spread)} r={6+Math.sqrt(f.n/Math.max(1,...stats.map(f=>f.n)))*13} fill={FACTION_COLORS[FACTIONS.indexOf(f.name)]} fillOpacity={f.n<minN?.3:.75} stroke={f.name===selected?'#244e40':'white'} strokeWidth={f.name===selected?3:1}/>{f.name===selected&&<g><rect x={Math.min(550,Math.max(70,x(f.mean)-65))} y={Math.max(36,y(f.spread)-49)} width="130" height="24" rx="5" fill="#244e40"/><text className="point-label" x={Math.min(615,Math.max(135,x(f.mean)))} y={Math.max(52,y(f.spread)-33)} textAnchor="middle">{f.short}</text></g>}</g>)}
    </svg>
    <RatingGuideCaption baseline={baseline}/>
    <Help>Each point is a faction. Size = number of ratings. Select a point to see its distribution. Faded points: n &lt; {minN}.</Help>
  </Panel><Panel title={selected+' · perceived strength'} eyebrow="SELECT SCORES TO EXPLORE THE RESPONDENTS">
    <div className="explorer-kpis"><div><b>{number(current.mean)}</b><span>mean · 1–7</span></div><div><b>{number(current.spread,2)}</b><span>observed spread (SD)</span></div><div><b>{number(current.n,0)}</b><span>valid ratings</span></div><div><b>{current.n===null?'—':(publicData?.summary.total??records.length)-current.n}</b><span>unavailable or blank</span></div></div>
    {current.n===null?<p className="explorer-caption">Rating counts and distribution are withheld for this small group. Choose a broader respondent group.</p>:<RangeHistogram label="Consensus rating selection" baseline={baseline} distribution={current.distribution} value={publicData?range:active||null} onSelect={next=>{setRange(next);onApply({kind:'rating',faction:selected,...next});}}/>}
    {!publicData&&<><div className="explorer-actions"><RangeFields value={range} onChange={setRange} label="Consensus score range"/><button className="button secondary" onClick={()=>onApply(rule)}>Apply range to all views</button><button className="button primary" onClick={()=>onRead(rule,'Meta')}><MessageSquare size={14}/> Read matching answers <ArrowRight size={14}/></button></div><p className="explorer-caption">{groupN} of the current {records.length} submissions meet this range. Dragging across bars applies the range immediately. Multiple faction ranges can be combined in the global opinion filters.</p></>}
    {publicData&&current.n!==null&&<p className="explorer-caption">Ratings in this range: {groupN}.</p>}
    <details><summary>How to read spread</summary><p className="explorer-caption">Spread is the standard deviation of ratings on the 1–7 scale. The calculation treats score steps as equally spaced.</p></details>
  </Panel></>;
}

function DuelUncertainty({records,pair,duel,outcomes,opinionFiltered,publicData}){
  const [show,setShow]=useState(false);
  const paired=records.filter(r=>Number.isInteger(r.strength[pair.a])&&Number.isInteger(r.strength[pair.b]));
  const browserIds=paired.map(r=>r.respondentId).filter(Boolean),repeated=publicData?duel.repeatSubmissions:browserIds.length-new Set(browserIds).size;
  const blocked=!duel.n||repeated>0||outcomes.some(r=>r.count==null);
  return <div className="duel-uncertainty"><label className="check-label"><input type="checkbox" checked={show&&!blocked} disabled={blocked} onChange={e=>setShow(e.target.checked)}/>Show exploratory 95% model intervals</label>
    {repeated>0&&<p className="explorer-caption">This pair includes repeat submissions from the same browser. {publicData?"Model intervals are unavailable for this public snapshot.":<>Enable “Keep only the latest response per Respondent ID” in <a href="#data">Data & methods</a> before showing intervals.</>}</p>}
    {show&&!blocked&&<><p className="interval-caution">Exploratory Wilson intervals for this response group.{opinionFiltered&&' Respondents were selected by their opinions.'}</p><div className="interval-chart">{outcomes.map(row=>{const ci=wilsonInterval(row.count,duel.n);return <div className="interval-row" key={row.key}><span>{row.label}</span><svg viewBox="0 0 100 20" role="img" aria-label={`${row.label}: ${percent(row.count,duel.n)}, pointwise 95% Wilson interval ${percent(ci.low,1)} to ${percent(ci.high,1)}`}><line x1="0" x2="100" y1="10" y2="10" stroke="#e4eadc"/>{[0,50,100].map(x=><line key={x} x1={x} x2={x} y1="7" y2="13" stroke="#c6d3b9" strokeWidth=".5"/>)}<g stroke={row.color} strokeWidth="1.4"><line x1={ci.low*100} x2={ci.high*100} y1="10" y2="10"/><line x1={ci.low*100} x2={ci.low*100} y1="6" y2="14"/><line x1={ci.high*100} x2={ci.high*100} y1="6" y2="14"/></g><circle cx={row.count/duel.n*100} cy="10" r="2.1" fill={row.color}/></svg><b>{percent(row.count,duel.n)}<small>{percent(ci.low,1)}–{percent(ci.high,1)}</small></b></div>;})}</div><p className="explorer-caption">Dot = response share · line = pointwise 95% Wilson interval · ties count as equal.</p><details><summary>Interval method</summary><p className="explorer-caption">Wilson intervals treat each outcome as binary across independent responses. They describe sampling variation within this group. Selection and repeat-player effects are not included. Each interval is calculated separately.</p></details></>}
  </div>;
}

function FactionDuels({records,minN,onRead,opinionFiltered,publicData}){
  const [pair,setPair]=useState({a:'Temple of Ro-Kan',b:'Prefecture of Ryu'});
  const duel=useMemo(()=>publicData?publicDuel(publicData,pair.a,pair.b):pairedDuel(records,pair.a,pair.b),[records,pair.a,pair.b,publicData]);
  const matrix=useMemo(()=>FACTIONS.map(a=>FACTIONS.map(b=>publicData?publicDuel(publicData,a,b):pairedDuel(records,a,b))),[records,publicData]);
  const choose=outcome=>onRead({kind:'duel',...pair,outcome},'Meta');
  const outcomes=[{key:'higher',label:short(pair.a)+' rated higher',count:duel.higher,color:'#6f9667'},{key:'equal',label:'Both rated equally',count:duel.equal,color:'#c5b58c'},{key:'lower',label:short(pair.b)+' rated higher',count:duel.lower,color:'#b78f78'}];
  return <><Panel title="A direct perception duel" eyebrow="BOTH SCORES FROM THE SAME SUBMISSION"><PairPicker label="Duel" pair={pair} onChange={setPair}/>
    <div className="duel-coverage"><b>{number(duel.n,0)}</b><span>submissions rated both factions · {number(duel.excluded,0)} excluded because one or both ratings are unavailable</span></div>
    <OutcomeRows readable={!publicData} n={duel.n} onChoose={choose} rows={outcomes}/>
    <DuelUncertainty publicData={publicData} records={records} pair={pair} duel={duel} outcomes={outcomes} opinionFiltered={opinionFiltered}/>
    <Help>{publicData?'Paired faction ratings · n = '+number(duel.n,0)+'. Ties count as equal.':'Select an outcome to read its written answers. Ties count as equal.'}</Help>
    {duel.withheld?<p className="explorer-caption">Distribution hidden for small counts.</p>:<>    <div className="difference-heading"><h3>Within-person score differences</h3><span>{short(pair.a)} − {short(pair.b)} · mean {number(duel.meanDifference)}</span></div><div className="difference-hist" role="img" aria-label={'Paired score differences: '+duel.distribution.map((n,i)=>`${i-6}: ${n}`).join(', ')}>{duel.distribution.map((count,i)=><div key={i} title={`Difference ${i-6}: ${count} submissions`}><small>{count}</small><i style={{height:Math.max(2,count/Math.max(1,...duel.distribution)*90)+'px',background:i<6?'#b78f78':i>6?'#6f9667':'#c5b58c'}}/><b>{i-6}</b></div>)}</div>
</>}
  </Panel><Panel title="Compare every faction pair" eyebrow="ROW RATED HIGHER THAN COLUMN (%)"><details className="duel-matrix-details"><summary>Open the interactive all-pairs matrix</summary><div className="table-scroll"><table className="heatmap"><thead><tr><th>Row faction</th>{SHORT.map((f,i)=><th key={f}><span title={FACTIONS[i]}>{f}</span></th>)}</tr></thead><tbody>{matrix.map((row,i)=><tr key={FACTIONS[i]}><th>{SHORT[i]}</th>{row.map((c,j)=><td key={c.b}><button disabled={i===j} aria-label={`Compare ${c.a} with ${c.b}`} className={'heatcell pair-cell '+(i===j?'mirror ':'')+(c.n<minN?'insufficient ':'')+(pair.a===c.a&&pair.b===c.b?'chosen':'')} onClick={()=>setPair({a:c.a,b:c.b})} style={{background:i===j?undefined:c.n&&c.higher!==null?`rgba(68,105,79,${.05+c.higher/c.n*.6})`:undefined}} title={`${c.a} higher than ${c.b}: ${number(c.higher,0)} of ${number(c.n,0)}; ${number(c.equal,0)} equal`}><b>{i===j||!c.n||c.higher===null?'—':Math.round(c.higher/c.n*100)}</b><small>n {number(c.n,0)}</small></button></td>)}</tr>)}</tbody></table></div></details><Help>Each cell uses its own paired denominator. Click a cell to update the duel above.</Help></Panel></>;
}

function MatchupCrossCheck({records,minN,onRead,publicData}){
  const [pair,setPair]=useState({a:'Ito Clan',b:'Minimoto Clan'});
  const sides=publicData?[publicReciprocal(publicData,pair.a,pair.b),publicReciprocal(publicData,pair.b,pair.a)]:[reciprocalMatchup(records,pair.a,pair.b),reciprocalMatchup(records,pair.b,pair.a)];
  const [a,b]=sides,na=a.good-a.bad,nb=b.good-b.bad;
  let observation='Good and bad nomination counts are equal on at least one side.';
  if(!a.n||!b.n)observation='Not enough answers from both factions to compare.';
  else if(a.n<minN||b.n<minN)observation='Too few matchup answers from one side.';
  else if(na<0&&nb<0)observation='Both sides named this pairing as bad more often than good.';
  else if(na>0&&nb>0)observation='Both sides named this pairing as good more often than bad.';
  else if(na>0&&nb<0)observation='Both sides’ nomination directions favour '+pair.a+' in their perceptions.';
  else if(na<0&&nb>0)observation='Both sides’ nomination directions favour '+pair.b+' in their perceptions.';
  if(publicData&&sides.some(side=>[side.good,side.bad,side.both,side.neither].some(n=>n===null)))observation="Some counts are hidden; choose another pairing or group.";
  return <><Panel title="Do the two sides see the matchup alike?" eyebrow="MATCHUP PERCEPTIONS"><PairPicker label="Matchup cross-check" pair={pair} onChange={setPair}/><div className="matchup-observation"><Eye size={18}/><p>{observation}</p></div><Help>Each side counts players of that faction who answered at least one matchup question.</Help></Panel>
    <div className="reciprocal-grid">{sides.map(side=><Panel key={side.main} title={side.main+' → '+short(side.opponent)} eyebrow="PERCEPTIONS FROM THIS MAIN FACTION">
      <div className="duel-coverage"><b>{number(side.n,0)}</b><span>answered the matchup questions · {number(side.owners,0)} main-faction submissions in this selection</span></div>
      <OutcomeRows readable={!publicData} n={side.n} onChoose={outcome=>onRead({kind:'matchup',main:side.main,opponent:side.opponent,outcome},'Faction & Matchups')} rows={[{key:'good',label:'Nominated as good only',count:side.good,color:'#6f9667'},{key:'bad',label:'Nominated as bad only',count:side.bad,color:'#b78f78'},{key:'both',label:'Both good and bad (flagged)',count:side.both,color:'#c5a564'},{key:'neither',label:'Not nominated on either list',count:side.neither,color:'#d1d9c6'}]}/>
      <p className="explorer-caption">Players could list up to three opponents as good and bad. “Both” shows players who listed the same opponent in both groups.</p>
      {!publicData&&<><button className="button secondary" disabled={!side.good&&!side.bad&&!side.both} onClick={()=>onRead({kind:'matchup',main:side.main,opponent:side.opponent,outcome:'either'},'Faction & Matchups')}>Read voices naming this opponent <ArrowRight size={14}/></button>
      <details className="matchup-excerpts"><summary>{side.comments.length} written explanations from these voices</summary>{side.comments.slice(0,3).map(c=><blockquote key={c.id}>{c.text.length>320?c.text.slice(0,320)+'…':c.text}<small>{c.experience||'Experience not provided'}</small></blockquote>)}{!side.comments.length&&<p className="explorer-caption">No written explanations from these respondents.</p>}<p className="explorer-caption">The original question covers the whole faction and several matchups. An extract may discuss other opponents too.</p></details></>}
    </Panel>)}</div></>;
}

function NominationNetwork({records,onRead,publicData}){
  const [category,setCategory]=useState('strongest'),[minimum,setMinimum]=useState(publicData?5:2),[selected,setSelected]=useState([]);
  const data=useMemo(()=>publicData?.networks[category]||coNominations(records,category),[records,category,publicData]);
  const maxEdge=Math.max(publicData?5:1,...data.edges.map(e=>e.count)),nodes=data.nodes.filter(n=>n.count),maxNode=Math.max(1,...nodes.map(n=>n.count));
  useEffect(()=>{if(minimum>maxEdge)setMinimum(maxEdge);},[maxEdge]);
  const positions=new Map(nodes.map((n,i)=>{const angle=-Math.PI/2+i/nodes.length*Math.PI*2;return[n.name,{x:450+Math.cos(angle)*235,y:325+Math.sin(angle)*235,angle,r:15+Math.sqrt(n.count/maxNode)*19}];}));
  const edges=data.edges.filter(e=>e.count>=minimum),groupN=publicData?publicNetworkCount(data,selected):selected.length?records.filter(r=>selected.every(f=>r[category].includes(f))).length:0;
  function toggle(name){setSelected(prev=>prev.includes(name)?prev.filter(f=>f!==name):prev.length<3?[...prev,name]:prev);}
  const activate=(e,fn)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}};
  return <Panel title="Which factions are nominated together?" eyebrow="CO-NOMINATIONS" action={<select aria-label="Network nomination question" value={category} onChange={e=>{setCategory(e.target.value);setSelected([]);}}><option value="strongest">Strongest-faction perceptions</option><option value="weakest">Weakest-faction perceptions</option></select>}>
    <div className="network-controls"><label>Show links with at least <b>{minimum}</b> joint nominations<input aria-label="Minimum joint nominations" type="range" min={publicData?5:1} max={maxEdge} value={minimum} onChange={e=>setMinimum(Number(e.target.value))}/></label><span>{data.n} submissions answered this nomination question</span><button className="text-button" onClick={()=>setSelected([])}><RotateCcw size={13}/> Clear node selection</button></div>
    <p className="explorer-caption">Select up to three factions. Node size = nominations; link width = shared nominations.</p>
    <svg className="nomination-network" viewBox="0 0 900 660" role="group" aria-label="Network of factions jointly nominated in the survey">
      {edges.map(e=>{const a=positions.get(e.a),b=positions.get(e.b),highlight=!selected.length||(selected.includes(e.a)&&selected.includes(e.b))||(selected.length===1&&(selected.includes(e.a)||selected.includes(e.b)));return <g key={e.a+e.b} className={'co-edge '+(highlight?'':'muted-edge')} role="button" tabIndex="0" aria-label={`Select joint nominations ${e.a} and ${e.b}`} onClick={()=>setSelected([e.a,e.b])} onKeyDown={event=>activate(event,()=>setSelected([e.a,e.b]))}><title>{e.a} + {e.b}: {e.count} of {data.n} nomination responses</title><line className="edge-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="15"/><line className="edge-visible" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#8fa983" strokeOpacity=".55" strokeWidth={1+Math.sqrt(e.count/maxEdge)*8}/></g>;})}
      {nodes.map(node=>{const p=positions.get(node.name),chosen=selected.includes(node.name),dx=Math.cos(p.angle)*(p.r+15),dy=Math.sin(p.angle)*(p.r+15);return <g key={node.name} className={'co-node '+(chosen?'selected':'')} role="button" tabIndex="0" aria-label={'Toggle network faction '+node.name} aria-pressed={chosen} onClick={()=>toggle(node.name)} onKeyDown={e=>activate(e,()=>toggle(node.name))}><title>{node.name}: {node.count} of {data.n} nomination responses</title><circle cx={p.x} cy={p.y} r={p.r} fill={FACTION_COLORS[FACTIONS.indexOf(node.name)]} fillOpacity={chosen?1:.78} stroke={chosen?'#244e40':'white'} strokeWidth={chosen?4:2}/><text className="network-number" x={p.x} y={p.y+4} textAnchor="middle">{node.count}</text><text x={p.x+dx} y={p.y+dy+4} textAnchor={Math.cos(p.angle)>.2?'start':Math.cos(p.angle)<-.2?'end':'middle'}>{node.short}</text></g>;})}
      {!nodes.length&&<text x="450" y="325" textAnchor="middle">No nominations in this selection.</text>}
    </svg>
    <div className="network-node-list" role="group" aria-label="Select nomination network nodes">{nodes.map(node=><button key={node.name} aria-pressed={selected.includes(node.name)} aria-disabled={selected.length===3&&!selected.includes(node.name)} onClick={()=>toggle(node.name)}>{node.short}<small>{node.count}</small></button>)}</div>
    {!edges.length&&nodes.length>0&&<p className="explorer-caption">No links reach this minimum. Lower the link threshold to inspect rarer co-nominations.</p>}
    <div className="network-selection"><div><span className="eyebrow">SELECTED NOMINATION GROUP</span><h3>{selected.length?selected.join(' + '):'Choose one to three factions'}</h3><p>{selected.length?<><b>{groupN??"—"}</b> of {data.n} nomination responses include all selected factions ({percent(groupN,data.n)}).</>:'Select factions to see how often they were nominated together.'}</p></div>{!publicData&&<button className="button primary" disabled={!selected.length||!groupN} onClick={()=>onRead({kind:'nominations',category,factions:[...selected]},'Meta')}>Read this group’s answers <ArrowRight size={14}/></button>}</div>
    <details className="network-table"><summary>Joint nominations as a table</summary><div className="table-scroll"><table><thead><tr><th>Faction A</th><th>Faction B</th><th>Joint n</th><th>Of nomination responses</th><th/></tr></thead><tbody>{edges.map(e=><tr key={e.a+e.b}><td>{e.a}</td><td>{e.b}</td><td>{e.count}</td><td>{percent(e.count,data.n)}</td><td><button className="text-button" onClick={()=>setSelected([e.a,e.b])}>Select pair <ArrowRight size={12}/></button></td></tr>)}</tbody></table></div></details>
    <Help>Each response counts once per faction and faction pair. Three selected factions must appear together in one answer.</Help>
  </Panel>;
}

export default function PerceptionExplorer({records=[],minN,rules=[],onApply=()=>{},onRead=()=>{},publicData}){
  const [view,setView]=useState('consensus');
  return <><div className="explorer-tabs" role="group" aria-label="Perception explorer views">{[['consensus','Consensus map'],['duels','Faction duels'],['matchups','Matchup cross-check'],['network','Co-nomination network']].map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>setView(id)}>{label}</button>)}</div>
    {view==='consensus'&&<ConsensusMap publicData={publicData} records={records} minN={minN} rules={rules} onApply={onApply} onRead={onRead}/>}
    {view==='duels'&&<FactionDuels publicData={publicData} records={records} minN={minN} onRead={onRead} opinionFiltered={rules.length>0}/>}
    {view==='matchups'&&<MatchupCrossCheck publicData={publicData} records={records} minN={minN} onRead={onRead}/>}
    {view==='network'&&<NominationNetwork publicData={publicData} records={records} onRead={onRead}/>}
  </>;
}
