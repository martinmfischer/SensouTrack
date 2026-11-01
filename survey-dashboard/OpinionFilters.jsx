import React,{useMemo,useRef,useState} from 'react';
import {ArrowRight,Filter,MessageSquare,X} from 'lucide-react';
import {FACTIONS,opinionKey,opinionLabel,summary,medianFromDistribution,factionBaseline} from './analysis.mjs';
import RatingGuides,{RatingGuideCaption} from './RatingGuides.jsx';
import {PERCEPTION_SCALE} from './palette.mjs';
import './exploration.css';

export function RangeFields({value,onChange,label}){
  return <div className="range-fields"><label>From<select aria-label={label+' minimum'} value={value.min} onChange={e=>{const min=Number(e.target.value);onChange({min,max:Math.max(min,value.max)});}}>{[1,2,3,4,5,6,7].map(n=><option key={n}>{n}</option>)}</select></label><span>–</span><label>To<select aria-label={label+' maximum'} value={value.max} onChange={e=>{const max=Number(e.target.value);onChange({min:Math.min(value.min,max),max});}}>{[1,2,3,4,5,6,7].map(n=><option key={n}>{n}</option>)}</select></label></div>;
}

export function RangeHistogram({distribution,value,onSelect,label,baseline}){
  const [preview,setPreview]=useState(null),drag=useRef(null),selected=preview||value,max=Math.max(1,...distribution),median=medianFromDistribution(distribution);
  const scoreAt=e=>{const rect=e.currentTarget.getBoundingClientRect();return Math.max(1,Math.min(7,Math.floor((e.clientX-rect.left)/rect.width*7)+1));};
  const range=()=>({min:Math.min(drag.current.start,drag.current.end),max:Math.max(drag.current.start,drag.current.end)});
  return <><div className="brush-histogram" role="group" aria-label={label}
    onPointerDown={e=>{const button=e.target.closest('button[data-score]');if(!button||e.button!==0)return;const score=Number(button.dataset.score);drag.current={start:score,end:score};setPreview(range());e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{if(!drag.current)return;drag.current.end=scoreAt(e);setPreview(range());}}
    onPointerUp={e=>{if(!drag.current)return;drag.current.end=scoreAt(e);const next=range();drag.current=null;setPreview(null);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);onSelect(next);}}
    onPointerCancel={()=>{drag.current=null;setPreview(null);}}>
    {distribution.map((count,i)=>{const score=i+1,active=selected&&score>=selected.min&&score<=selected.max;return <button data-score={score} type="button" key={score} aria-label={`${label}: score ${score}, ${count} answers`} aria-pressed={Boolean(active)} className={active?'selected':''} onClick={e=>{if(e.detail===0)onSelect({min:score,max:score});}} title={`${score}: ${count} answers. Click or drag to select.`}><small>{count}</small><i style={{height:Math.max(3,count/max*80)+'px',background:PERCEPTION_SCALE[i]}}/><b>{score}</b></button>;})}
    <RatingGuides baseline={baseline?.value??null} histogram/>
  </div><RatingGuideCaption baseline={baseline} median={median}/></>;
}

export default function OpinionFilters({baseRows,selectedCount,rules,onApply,onRemove,onClear,onRead}){
  const [target,setTarget]=useState('Temple of Ro-Kan'),[strength,setStrength]=useState({min:6,max:7}),[satisfaction,setSatisfaction]=useState({min:1,max:3});
  const rating=useMemo(()=>summary(baseRows.map(r=>r.strength[target])),[baseRows,target]);
  const mood=useMemo(()=>summary(baseRows.map(r=>r.satisfaction)),[baseRows]);
  const baseline=useMemo(()=>factionBaseline(FACTIONS.map(f=>summary(baseRows.map(r=>r.strength[f])))),[baseRows]);
  const strengthRule={kind:'rating',faction:target,...strength},satisfactionRule={kind:'satisfaction',...satisfaction};
  return <section className="opinion-filter-section" aria-label="Opinion group filters">
    <details className="opinion-builder"><summary><span><Filter size={15}/> Filter respondents by their opinions</span><small>Select ratings, then explore their answers</small></summary>
      <p className="opinion-baseline">Histogram preview: {baseRows.length} submissions after the experience, main-faction, date and quality filters, before opinion conditions. Missing ratings are excluded.</p>
      <div className="opinion-builder-grid"><div><h3>Perceived faction strength</h3><select aria-label="Opinion filter target faction" value={target} onChange={e=>setTarget(e.target.value)}>{FACTIONS.map(f=><option key={f}>{f}</option>)}</select><RangeHistogram baseline={baseline} label="Strength opinion brush" distribution={rating.distribution} value={strength} onSelect={next=>{setStrength(next);onApply({kind:'rating',faction:target,...next});}}/><div className="brush-actions"><RangeFields label="Strength filter" value={strength} onChange={setStrength}/><button className="button secondary" onClick={()=>onApply(strengthRule)}>Apply strength range</button></div><p>{rating.n} valid ratings · {baseRows.length-rating.n} unavailable or blank</p></div>
      <div><h3>Meta satisfaction</h3><RangeHistogram label="Satisfaction opinion brush" distribution={mood.distribution} value={satisfaction} onSelect={next=>{setSatisfaction(next);onApply({kind:'satisfaction',...next});}}/><div className="brush-actions"><RangeFields label="Satisfaction filter" value={satisfaction} onChange={setSatisfaction}/><button className="button secondary" onClick={()=>onApply(satisfactionRule)}>Apply satisfaction range</button></div><p>{mood.n} valid ratings · {baseRows.length-mood.n} unavailable or blank</p></div></div>
      <p className="brush-instruction">Drag across bars, click one score, or use the range fields. Conditions combine with AND. “Not enough experience” never counts as a low rating.</p>
    </details>
    {rules.length>0&&<div className="opinion-selection" aria-live="polite"><div className="opinion-selection-heading"><span><b>{selectedCount}</b> submissions match every opinion condition</span><button className="text-button" onClick={onClear}>Clear opinion conditions <X size={12}/></button></div><div className="opinion-chips">{rules.map(rule=><span key={opinionKey(rule)}>{opinionLabel(rule)}<button onClick={()=>onRemove(opinionKey(rule))} aria-label={'Remove condition: '+opinionLabel(rule)}><X size={12}/></button></span>)}</div><button className="button secondary" onClick={onRead}><MessageSquare size={14}/> Read this group’s answers <ArrowRight size={14}/></button><p>All charts, topic counts and conditional theme questions now use this group. Only eligible respondents enter each follow-up’s denominator.</p></div>}
  </section>;
}
