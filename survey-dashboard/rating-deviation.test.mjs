import test from 'node:test';import assert from 'node:assert/strict';
import {ratingDeviation,deviationLimit,deviationColour,signedRating} from './rating-deviation.mjs';
import {ratingCell,crossTable} from './cross-analysis.mjs';import {FACTIONS} from './analysis.mjs';
test('group deviations use the same faction valid-rating mean, preserve suppression and stay on a symmetric scale',()=>{
 const target=FACTIONS[1],rows=[1,1,1,7,null].map((value,i)=>({mainFaction:i<3?FACTIONS[0]:FACTIONS[2],strength:{...Object.fromEntries(FACTIONS.map(f=>[f,null])),[target]:value},strongest:[],weakest:[]}));
 const whole=ratingCell(rows,target),table=crossTable(rows);assert.equal(whole.value,2.5);assert.equal(whole.n,4);
 assert.equal(ratingDeviation(table[0].cells[1],whole),-1.5);assert.equal(ratingDeviation(table[1].cells[1],whole),4.5);
 assert.equal(ratingDeviation({value:null},whole),null);assert.equal(ratingDeviation({value:5},{value:null}),null);assert.equal(ratingDeviation({value:undefined},whole),null);
 assert.equal(deviationLimit(table,[whole]),4.5);assert.equal(signedRating(0),'0.0');assert.equal(signedRating(.04),'0.0');assert.equal(signedRating(-.04),'0.0');assert.equal(signedRating(1.25),'+1.3');assert.equal(signedRating(null),'—');
 assert.equal(table[0].cells[1].value,1,'Switching display must preserve raw means and histograms');
});

test('deviation colours retain typical variation when a few cells are extreme and keep labels legible',()=>{
 const overall=[{target:'f',value:4}],table=values=>[{cells:values.map(value=>({target:'f',value:4+value}))}];
 const typical=Array(100).fill(.5);
 assert.equal(deviationLimit(table(typical),overall),.5);
 assert.equal(deviationLimit(table([...typical,3,-3,null]),overall),.5);
 assert.equal(deviationLimit([],overall),.5);
 assert.deepEqual(deviationColour(null,.5),{});
 assert.deepEqual(deviationColour(.5,.5),deviationColour(3,.5));
 assert.deepEqual(deviationColour(-.5,.5),deviationColour(-3,.5));
 assert.notEqual(deviationColour(.2,.5).background,deviationColour(-.2,.5).background);
 assert.notEqual(deviationColour(.2,.5).background,deviationColour(0,.5).background);
 for(let i=-100;i<=100;i++){
  const style=deviationColour(i/100,.75),rgb=style.background.match(/\d+/g).map(Number);
  const channels=rgb.map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  const light=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  const contrast=style.color==='#fff'?1.05/(light+.05):(light+.05)/.05;
  assert.ok(contrast>=4.5,`${i/100}: contrast ${contrast}`);
 }
});
