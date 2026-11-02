import test from 'node:test';
import assert from 'node:assert/strict';
import {rankMatchups} from './matchup-rankings.mjs';

test('matchup rankings use directional net shares, exclude mirrors and withheld rows, and cap each end at ten',()=>{
  const cells=Array.from({length:12},(_,i)=>({opponent:'Opponent '+i,net:(i+1)/20,best:i+1,worst:0}));
  const rows=[{faction:'A',n:20,cells:[...cells,{opponent:'A',net:1},{opponent:'Hidden',net:null},{opponent:'Neutral',net:0}]},
    {faction:'B',n:10,cells:cells.map(c=>({...c,net:-c.net}))},
    {faction:'Hidden',n:null,cells:[{opponent:'A',net:1}]},
    {faction:'Small',n:4,cells:[{opponent:'A',net:1}]}];
  const {top,bottom}=rankMatchups(rows);
  assert.equal(top.length,10);assert.equal(bottom.length,10);
  assert.equal(top[0].net,.6);assert.equal(bottom[0].net,-.6);
  assert.ok(top.every(p=>p.faction==='A'&&p.n===20));assert.ok(bottom.every(p=>p.faction==='B'));
  assert.deepEqual(rankMatchups([]),{top:[],bottom:[]});
  assert.equal(rows[0].cells[0].net,.05);
});
