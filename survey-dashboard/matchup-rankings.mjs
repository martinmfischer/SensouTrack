export function rankMatchups(rows){
  const pairs=rows.filter(row=>Number.isFinite(row.n)&&row.n>=5).flatMap(row=>
    row.cells.filter(cell=>!cell.mirror&&cell.opponent!==row.faction&&Number.isFinite(cell.net)).map(cell=>({...cell,faction:row.faction,n:row.n}))
  );
  const tie=(a,b)=>b.n-a.n||a.faction.localeCompare(b.faction)||a.opponent.localeCompare(b.opponent);
  return {
    top:pairs.filter(pair=>pair.net>0).sort((a,b)=>b.net-a.net||tie(a,b)).slice(0,10),
    bottom:pairs.filter(pair=>pair.net<0).sort((a,b)=>a.net-b.net||tie(a,b)).slice(0,10),
  };
}
