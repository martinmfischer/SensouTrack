import {FACTIONS,SHORT,summary} from './analysis.mjs';

const valid=v=>Number.isInteger(v)&&v>=1&&v<=7;

// Pointwise 95% Wilson score interval under an independent Bernoulli model.
export function wilsonInterval(count,n){
  if(!Number.isInteger(n)||n<=0||!Number.isInteger(count)||count<0||count>n)return null;
  const z=1.959963984540054,z2=z*z,p=count/n,den=1+z2/n;
  const centre=(p+z2/(2*n))/den,half=z*Math.sqrt(p*(1-p)/n+z2/(4*n*n))/den;
  return {low:Math.max(0,centre-half),high:Math.min(1,centre+half)};
}
export function consensus(records){
  return FACTIONS.map((name,i)=>{
    const values=records.map(r=>r.strength[name]).filter(valid),s=summary(values);
    const spread=s.n>=2?Math.sqrt(values.reduce((n,v)=>n+(v-s.mean)**2,0)/s.n):null;
    return {name,short:SHORT[i],...s,spread};
  });
}
export function pairedDuel(records,a,b){
  const pairs=a===b?[]:records.filter(r=>valid(r.strength[a])&&valid(r.strength[b]));
  const differences=pairs.map(r=>r.strength[a]-r.strength[b]);
  return {a,b,n:pairs.length,excluded:records.length-pairs.length,higher:differences.filter(v=>v>0).length,equal:differences.filter(v=>v===0).length,lower:differences.filter(v=>v<0).length,
    meanDifference:differences.length?differences.reduce((n,v)=>n+v,0)/differences.length:null,
    distribution:Array.from({length:13},(_,i)=>differences.filter(v=>v===i-6).length)};
}
export function reciprocalMatchup(records,main,opponent){
  const owners=records.filter(r=>r.mainFaction===main),answered=owners.filter(r=>r.best.length||r.worst.length);
  const result={main,opponent,owners:owners.length,n:main===opponent?0:answered.length,good:0,bad:0,both:0,neither:0,comments:[]};
  if(main===opponent)return result;
  for(const r of answered){
    const good=r.best.includes(opponent),bad=r.worst.includes(opponent);
    result[good&&bad?'both':good?'good':bad?'bad':'neither']++;
    if((good||bad)&&r.factionComment)result.comments.push({id:r.id,text:r.factionComment,experience:r.experience});
  }
  return result;
}
export function coNominations(records,category='strongest'){
  if(!['strongest','weakest'].includes(category))throw new Error('Unknown nomination question.');
  const answered=records.filter(r=>r[category].length),counts=new Map(),edges=new Map();
  for(const r of answered){
    const names=[...new Set(r[category].filter(f=>FACTIONS.includes(f)))].sort((a,b)=>FACTIONS.indexOf(a)-FACTIONS.indexOf(b));
    for(const name of names)counts.set(name,(counts.get(name)||0)+1);
    for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
      const key=names[i]+'|'+names[j];if(!edges.has(key))edges.set(key,{a:names[i],b:names[j],count:0});edges.get(key).count++;
    }
  }
  return {category,n:answered.length,nodes:FACTIONS.map((name,i)=>({name,short:SHORT[i],count:counts.get(name)||0})),edges:[...edges.values()].sort((a,b)=>b.count-a.count||a.a.localeCompare(b.a)||a.b.localeCompare(b.b))};
}
