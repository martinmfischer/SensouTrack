import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import CrossReferences from '../../survey-dashboard/CrossReferences.jsx';
import PerceptionExplorer from '../../survey-dashboard/PerceptionExplorer.jsx';
import {Factions,Themes,Satisfaction,FactionDetail,Matchups} from '../../survey-dashboard/charts.jsx';
import {Meta} from '../../src/meta.jsx';

const data=JSON.parse(fs.readFileSync('public/survey/summary.json','utf8')).analysis;
const small=structuredClone(data);
small.cross.faction.rating=[];
const cross=renderToStaticMarkup(<CrossReferences minN={5} publicData={small}/>);
assert.match(cross,/No groups meet the minimum/);
assert.ok(!cross.includes('SELECTED CELL'),'An empty comparison must not borrow overall ratings');
const current=small.consensus.find(f=>f.name==='Temple of Ro-Kan');
Object.assign(current,{n:null,mean:null,spread:null,distribution:Array(7).fill(0)});
const explorer=renderToStaticMarkup(<PerceptionExplorer minN={5} publicData={small}/>);
assert.match(explorer,/Rating counts and distribution are withheld/);
assert.ok(!explorer.includes('Consensus rating selection'),'Withheld distribution must not become a zero histogram');
assert.ok(!explorer.includes('0 valid ratings in the selected score range'));
const hiddenMatchups=renderToStaticMarkup(<Matchups a={{matchups:data.summary.matchups.map(r=>({...r,n:null}))}} minN={5}/>);
assert.match(hiddenMatchups,/Choose a broader group/);
assert.ok(!hiddenMatchups.includes('heatmap'),'A fully withheld group should have one useful empty state');
const satisfaction=renderToStaticMarkup(<Satisfaction s={{n:null,mean:null,median:null,distribution:Array(7).fill(0)}}/>);
assert.ok(!satisfaction.includes('rating-hist'));
for(const element of [<Factions a={data.summary} minN={5} onSelect={()=>{}}/>,<Themes a={data.summary}/>,<FactionDetail name="Horse Lords of Ataka" a={data.summary} minN={5} onClose={()=>{}}/>,<CrossReferences minN={5} publicData={data}/>]){
  const html=renderToStaticMarkup(element);
  assert.ok(!/null|NaN|undefined/.test(html),'Published charts must format suppressed counts explicitly');
}
const games=['2026-01-01','2026-01-02','2026-01-11'].map(date=>({date,ownFaction:'ito-clan',opponentFaction:'minimoto-clan',ownTheme:'Cold Blood',opponentTheme:'The Finest Steel',ownVp:2,opponentVp:1}));
const meta=renderToStaticMarkup(<Meta games={games} source="live" onReport={()=>{}} onFaction={()=>{}}/>);
const activity=meta.slice(meta.indexOf('class="activity-chart"'));
const secondX=Number(activity.match(/<path d="[^\"]*?L ([\d.]+) /)[1]);
assert.ok(Math.abs(secondX-55.4)<.001,'A one-day step on a ten-day chart must occupy one tenth of the horizontal span');
console.log('Survey UI regressions passed: empty groups, withheld ratings/counts, satisfaction, date spacing.');
