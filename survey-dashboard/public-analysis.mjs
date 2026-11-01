export function publicDuel(data,a,b){
  const same=data.duels.find(d=>d.a===a&&d.b===b);if(same)return same;
  const reverse=data.duels.find(d=>d.a===b&&d.b===a);
  if(reverse)return {...reverse,a,b,higher:reverse.lower,lower:reverse.higher,meanDifference:reverse.meanDifference===null?null:-reverse.meanDifference,distribution:[...reverse.distribution].reverse()};
  return {a,b,n:null,excluded:null,higher:null,equal:null,lower:null,meanDifference:null,distribution:Array(13).fill(0),repeatSubmissions:0,withheld:true};
}
export function publicReciprocal(data,main,opponent){
  return {...(data.reciprocal.find(r=>r.main===main&&r.opponent===opponent)||{main,opponent,owners:null,n:null,good:null,bad:null,both:null,neither:null}),comments:[]};
}
export function publicNetworkCount(data,selected){
  if(selected.length===1)return data.nodes.find(n=>n.name===selected[0])?.count??null;
  if(selected.length===2)return data.edges.find(e=>selected.includes(e.a)&&selected.includes(e.b))?.count??null;
  if(selected.length===3)return data.triples.find(t=>selected.every(f=>t.factions.includes(f)))?.count??null;
  return null;
}
