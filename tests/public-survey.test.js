import test from 'node:test';
import assert from 'node:assert/strict';
import {publicSummary} from '../survey-dashboard/public-summary.mjs';
import {normalizeRows,FACTIONS} from '../survey-dashboard/analysis.mjs';
import {publicDuel,publicNetworkCount} from '../survey-dashboard/public-analysis.mjs';
test('public survey projection exports aggregates only and suppresses small nomination cells',()=>{
  const records=normalizeRows(Array.from({length:8},(_,i)=>({'Submission ID':'PRIVATE-'+i,'Respondent ID':'SECRET-'+i,'Submitted at':'2026-10-27T12:34:00Z','Main faction':FACTIONS[0],'What are the biggest problems?':'PRIVATE-TEXT','Which factions are strongest? (Up to three)':i===0?FACTIONS[0]:FACTIONS[1],[`How strong is each faction? [${FACTIONS[0]}]`]:'6'}))).records;
  const output=publicSummary({formId:'2jEY7L',records,syncedAt:'2026-10-27T12:34:00Z'}),json=JSON.stringify(output);
  assert.ok(!/PRIVATE|SECRET|respondentId|submittedAt|comments|problems|records/.test(json));
  assert.equal(output.total,8);assert.equal(output.factions[0].n,8);assert.equal(output.factions[0].mean,6);
  assert.equal(output.factions[0].strongest,null);assert.equal(output.factions[1].strongest,7);
  assert.equal(output.factions[1].n,null);
  records.forEach((r,i)=>{r.strength[FACTIONS[1]]=i===0?7:2;r.strongThemes=['PRIVATE-FREE-TEXT'];});
  const partition=publicSummary({formId:'2jEY7L',records,syncedAt:'2026-10-27T12:34:00Z'});
  assert.equal(partition.duels[0].higher,null);assert.equal(partition.duels[0].lower,null);assert.equal(partition.duels[0].equal,null);
  assert.equal(partition.duels[0].meanDifference,null);assert.equal(partition.duels[0].distribution.reduce((n,v)=>n+v,0),0);
  assert.equal(publicDuel(partition.analysis,FACTIONS[1],FACTIONS[0]).meanDifference,null);
  assert.equal(partition.themes.length,0);
  assert.throws(()=>publicSummary({formId:'pretest',records:[]}));
});
test('public pair reversal and network selections retain their actual aggregate meaning',()=>{
  const data={summary:{total:20},duels:[{a:'A',b:'B',n:20,higher:9,equal:6,lower:5,meanDifference:1,distribution:Array.from({length:13},(_,i)=>i)}]};
  const reverse=publicDuel(data,'B','A');assert.equal(reverse.higher,5);assert.equal(reverse.lower,9);assert.equal(reverse.meanDifference,-1);assert.equal(reverse.distribution[0],12);
  const network={nodes:[{name:'A',count:9}],edges:[{a:'A',b:'B',count:6}],triples:[]};
  assert.equal(publicNetworkCount(network,['A','B']),6);assert.equal(publicNetworkCount(network,['A','B','C']),null);
});
test('matchup minimum applies to respondents in the faction row, not each nomination count',()=>{
  const records=normalizeRows(Array.from({length:8},(_,i)=>({'Submission ID':'ROW-'+i,'Main faction':FACTIONS[0],'Which factions are your best matchups?':i===0?FACTIONS[2]:FACTIONS[1]}))).records;
  const d=publicSummary({formId:'2jEY7L',records,syncedAt:'2026-10-27T12:00:00Z'});
  const row=d.matchups[0],cell=row.cells.find(c=>c.opponent===FACTIONS[2]);
  assert.equal(row.n,8);assert.equal(cell.best,1);assert.equal(cell.worst,0);assert.equal(cell.net,1/8);
  assert.equal(d.matchups[1].n,null);assert.equal(d.matchups[1].cells[2].best,null);
  const reciprocal=d.analysis.reciprocal.find(r=>r.main===FACTIONS[0]&&r.opponent===FACTIONS[2]);
  assert.equal(reciprocal.n,8);assert.equal(reciprocal.good,1);assert.equal(reciprocal.neither,7);
  const tiny=publicSummary({formId:'2jEY7L',records:records.slice(0,4),syncedAt:'2026-10-27T12:00:00Z'});
  assert.equal(tiny.matchups[0].n,null);assert.equal(tiny.analysis.reciprocal[0].good,null);
});
