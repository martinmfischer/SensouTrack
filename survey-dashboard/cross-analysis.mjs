import {FACTIONS,SHORT,summary} from './analysis.mjs';

export const EXPERIENCES=['Beginner','Intermediate','Experienced'];
export function ratingCell(records,target,metric='rating'){
  const ratings=summary(records.map(r=>r.strength[target]));
  const missing={noExperience:0,skipped:0,invalid:0};
  for(const r of records)if(r.strength[target]===null){const status=r.strengthStatus?.[target]||'skipped';missing[status]=(missing[status]||0)+1;}
  const answered=metric==='rating'?records.filter(r=>r.strength[target]!==null):records.filter(r=>r[metric].length);
  const count=metric==='rating'?ratings.n:answered.filter(r=>r[metric].includes(target)).length;
  return {...ratings,missing,target,people:records.length,denominator:answered.length,count,value:metric==='rating'?ratings.mean:answered.length?count/answered.length:null};
}

export function crossTable(records,groupBy='faction',metric='rating'){
  const values=groupBy==='experience'?EXPERIENCES:FACTIONS;
  const key=groupBy==='experience'?'experience':'mainFaction';
  const groups=values.map((name,i)=>({name,label:groupBy==='experience'?name:SHORT[i],rows:records.filter(r=>r[key]===name)}));
  const unknown=records.filter(r=>!values.includes(r[key]));
  if(unknown.length)groups.push({name:'',label:'Not provided',rows:unknown});
  return groups.filter(g=>g.rows.length).map(({name,label,rows})=>({name,label,people:rows.length,cells:FACTIONS.map(f=>ratingCell(rows,f,metric))}));
}

export function ownershipComparison(records){
  return FACTIONS.map((name,i)=>{
    const own=summary(records.filter(r=>r.mainFaction===name).map(r=>r.strength[name]));
    // An unknown main faction is not evidence that this respondent plays another faction.
    const other=summary(records.filter(r=>r.mainFaction&&r.mainFaction!==name).map(r=>r.strength[name]));
    return {name,short:SHORT[i],own,other,gap:own.n&&other.n?own.mean-other.mean:null};
  });
}

export function conditionalThemes(records,target,perspective='all'){
  const base=records.filter(r=>perspective==='owners'?r.mainFaction===target:perspective==='others'?r.mainFaction&&r.mainFaction!==target:true);
  const eligible=base.filter(r=>r.strongest.includes(target));
  const valid=r=>(r.factionThemes[target]||[]).filter(t=>t!=='Not enough experience');
  const answered=eligible.filter(r=>valid(r).length);
  const noExperience=eligible.filter(r=>!valid(r).length&&(r.factionThemes[target]||[]).includes('Not enough experience')).length;
  const counts=new Map();for(const r of answered)for(const t of new Set(valid(r)))counts.set(t,(counts.get(t)||0)+1);
  const items=[...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  return {base:base.length,eligible:eligible.length,answered:answered.length,noExperience,skipped:eligible.length-answered.length-noExperience,
    outsideBranch:base.filter(r=>!r.strongest.includes(target)&&(r.factionThemes[target]||[]).length).length,items,
    experience:EXPERIENCES.map(name=>({name,eligible:eligible.filter(r=>r.experience===name).length,answered:answered.filter(r=>r.experience===name).length}))};
}
