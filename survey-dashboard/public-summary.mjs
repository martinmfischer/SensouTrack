import {aggregate,FACTIONS} from './analysis.mjs';
import {pairedDuel} from './exploration.mjs';
import catalogue from '../src/catalogue.json' with {type:'json'};
import {consensus,reciprocalMatchup,coNominations} from './exploration.mjs';
import {crossTable,ratingCell,ownershipComparison,conditionalThemes} from './cross-analysis.mjs';
import {analyzeTopics,TOPIC_RULES} from './text-topics.mjs';

// Public output is an explicit aggregate schema. No row, text, ID, timestamp,
// respondent cohort or free-form theme label can pass through this boundary.
export function publicSummary(snapshot){
  if(snapshot.formId!=='2jEY7L'||!Array.isArray(snapshot.records))throw new Error('Expected the main survey snapshot.');
  const rows=snapshot.records,a=aggregate(rows),minimum=5;
  const count=n=>n===0?0:n>=minimum?n:null;
  const stats=s=>s.n>=minimum?{n:s.n,mean:s.mean,median:s.median,distribution:s.distribution}:{n:null,mean:null,median:null,distribution:Array(7).fill(0)};
  const factions=a.factions.map(f=>({name:f.name,short:f.short,...stats(f),strongest:count(f.strongest),weakest:count(f.weakest),owners:count(f.owners),strongPoints:f.strongest>=minimum?f.strongPoints:null,weakPoints:f.weakest>=minimum?f.weakPoints:null,own:stats(f.own)}));
  // Matchup disclosure uses the number of respondents in the faction row. A
  // nomination is not a separate respondent group: suppressing every count<5
  // erased almost the entire matrix even when its row met the public minimum.
  const matchups=a.matchups.map(r=>({faction:r.faction,n:r.n>=minimum?r.n:null,cells:r.cells.map(c=>({opponent:c.opponent,mirror:c.mirror,best:r.n>=minimum?c.best:null,worst:r.n>=minimum?c.worst:null,net:r.n>=minimum?c.net:null}))}));
  const duels=[];for(let i=0;i<FACTIONS.length;i++)for(let j=i+1;j<FACTIONS.length;j++){
    const d=pairedDuel(rows,FACTIONS[i],FACTIONS[j]);
    // Suppress the complete partition if one small category could otherwise be
    // recovered by subtracting the other two from the public denominator.
    const withheld=[d.higher,d.equal,d.lower].some(n=>n>0&&n<minimum);
    const pairs=rows.filter(r=>Number.isInteger(r.strength[d.a])&&Number.isInteger(r.strength[d.b]));
    const ids=pairs.map(r=>r.respondentId).filter(Boolean);
    if(d.n>=minimum)duels.push({a:d.a,b:d.b,n:d.n,excluded:d.excluded,higher:withheld?null:d.higher,equal:withheld?null:d.equal,lower:withheld?null:d.lower,meanDifference:withheld?null:d.meanDifference,distribution:withheld?Array(13).fill(0):d.distribution,withheld,repeatSubmissions:ids.length-new Set(ids).size});
  }
  const known=new Set(catalogue.factions.flatMap(f=>f.themes.map(t=>`${f.name} — ${t}`)).concat(catalogue.ronin.themes.map(t=>`Ronin (cross-faction) — ${t}`)));
  const themes=a.themes.filter(t=>known.has(t.name)&&(t.strong>=minimum||t.weak>=minimum)).map(t=>({name:t.name,strong:count(t.strong),weak:count(t.weak)}));
  const conditional=(target,perspective)=>{
    const c=conditionalThemes(rows,target,perspective),allowed=new Set([...(catalogue.factions.find(f=>f.name===target)?.themes||[]),...catalogue.ronin.themes]);
    return {base:count(c.base),eligible:count(c.eligible),answered:count(c.answered),noExperience:count(c.noExperience),skipped:count(c.skipped),outsideBranch:count(c.outsideBranch),items:c.items.filter(t=>allowed.has(t.name)&&t.count>=minimum).map(t=>({name:t.name,count:t.count})),experience:c.experience.map(e=>({name:e.name,eligible:count(e.eligible),answered:count(e.answered)}))};
  };
  const cell=(c,metric)=>{const safe=stats(c),n=count(c.denominator),nominated=count(c.count);return {...safe,target:c.target,people:count(c.people),denominator:n,count:nominated,value:metric==='rating'?safe.mean:n&&nominated!==null?nominated/n:null,missing:{noExperience:count(c.missing.noExperience),skipped:count(c.missing.skipped),invalid:count(c.missing.invalid)}};};
  const cross={};for(const group of ['faction','experience']){cross[group]={};for(const metric of ['rating','strongest','weakest'])cross[group][metric]=crossTable(rows,group,metric).filter(r=>r.people>=minimum).map(r=>({name:r.name,label:r.label,people:r.people,cells:r.cells.map(c=>cell(c,metric))}));}
  const overall={};for(const metric of ['rating','strongest','weakest'])overall[metric]=FACTIONS.map(f=>cell(ratingCell(rows,f,metric),metric));
  const conditionalByFaction=Object.fromEntries(FACTIONS.map(f=>[f,Object.fromEntries(['all','owners','others'].map(p=>[p,conditional(f,p)]))]));
  const reciprocal=[];for(const main of FACTIONS)for(const opponent of FACTIONS)if(main!==opponent){const r=reciprocalMatchup(rows,main,opponent),hidden=r.n<minimum;reciprocal.push({main,opponent,owners:count(r.owners),n:hidden?null:r.n,good:hidden?null:r.good,bad:hidden?null:r.bad,both:hidden?null:r.both,neither:hidden?null:r.neither});}
  const networks={};for(const category of ['strongest','weakest']){const n=coNominations(rows,category);const triples=[];for(let i=0;i<FACTIONS.length;i++)for(let j=i+1;j<FACTIONS.length;j++)for(let k=j+1;k<FACTIONS.length;k++){const selected=[FACTIONS[i],FACTIONS[j],FACTIONS[k]],v=rows.filter(r=>selected.every(f=>r[category].includes(f))).length;if(v>=minimum)triples.push({factions:selected,count:v});}networks[category]={category,n:n.n,nodes:n.nodes.filter(v=>v.count>=minimum),edges:n.edges.filter(v=>v.count>=minimum),triples};}
  const topics={};for(const question of ['Meta','Themes','Faction & Matchups','']){const comments=a.comments.filter(c=>!question||c.type===question),t=analyzeTopics(comments);topics[question]={answers:count(t.answers),respondents:count(t.respondents),groupedAnswers:count(t.groupedAnswers),unassigned:count(t.unassigned.length),topics:t.allTopics.filter(v=>v.respondents>=minimum).map(v=>({id:v.id,label:v.label,words:TOPIC_RULES.find(r=>r.id===v.id).words,answers:v.answers,respondents:v.respondents}))};}
  const summary={total:rows.length,factions,strongDen:a.strongDen,weakDen:a.weakDen,rankedStrong:count(a.rankedStrong),rankedWeak:count(a.rankedWeak),satisfaction:stats(a.satisfaction),themes,matchups,selectedThemes:FACTIONS.map(f=>({faction:f,...conditional(f,'all')})),strongThemeDen:a.strongThemeDen,weakThemeDen:a.weakThemeDen,experience:a.experience.map(e=>({name:e.name,count:count(e.count)})),flagged:count(a.flagged),repeatRespondents:count(a.repeatRespondents),days:a.days.length&&a.days.every(d=>d.count>=minimum)?a.days:[]};
  return {schema:1,formId:'2jEY7L',syncedAt:snapshot.syncedAt,snapshotDay:new Date(snapshot.syncedAt).toISOString().slice(0,10),minimum,total:rows.length,
    satisfaction:summary.satisfaction,factions,matchups,duels,themes,strongThemeDen:a.strongThemeDen,weakThemeDen:a.weakThemeDen,strongDen:a.strongDen,weakDen:a.weakDen,
    analysis:{summary,consensus:consensus(rows).map(f=>({name:f.name,short:f.short,...stats(f),spread:f.n>=minimum?f.spread:null})),duels,reciprocal,networks,cross,overall,conditional:conditionalByFaction,ownership:ownershipComparison(rows).map(f=>{const own=stats(f.own),other=stats(f.other);return {name:f.name,short:f.short,own,other,gap:own.mean!==null&&other.mean!==null?own.mean-other.mean:null};}),topics,coverage:{submissions:rows.length,respondentsWithText:count(new Set(a.comments.map(c=>c.id)).size),writtenAnswers:count(a.comments.length),questions:Object.fromEntries(['Meta','Themes','Faction & Matchups'].map(q=>[q,count(a.comments.filter(c=>c.type===q).length)]))}}};
}
