import test from 'node:test';
import assert from 'node:assert/strict';
import {FACTIONS,normalizeRows,filterRecords,matchesOpinions,opinionKey,upsertOpinion,aggregate,medianFromDistribution,summary,factionBaseline} from './analysis.mjs';
import {consensus,pairedDuel,reciprocalMatchup,coNominations,wilsonInterval} from './exploration.mjs';
import {conditionalThemes} from './cross-analysis.mjs';

const [A,B,C]=FACTIONS;
test('The average-faction baseline gives factions equal weight and follows the selected cohort',()=>{
  const rows=[...Array.from({length:5},(_,i)=>record('a'+i,{ratings:{[A]:7}})),record('b',{ratings:{[B]:1},satisfaction:1})];
  assert.deepEqual(factionBaseline(aggregate(rows).factions),{value:4,factionCount:2,ratingCount:6});
  const selected=filterRecords(rows,{opinions:[{kind:'satisfaction',min:1,max:1}]});
  assert.deepEqual(factionBaseline(aggregate(selected).factions),{value:1,factionCount:1,ratingCount:1});
  assert.deepEqual(factionBaseline(aggregate([]).factions),{value:null,factionCount:0,ratingCount:0});
  assert.equal(factionBaseline([{mean:null,n:0},{mean:5,n:3}]).value,5);
});
test('Histogram medians agree with raw-score medians, including gaps, ties and even samples',()=>{
  for(const scores of [[],[7],[1,7],[2,2,2,6],[1,3,3,4,7],[4,4]]){
    const s=summary(scores);assert.equal(medianFromDistribution(s.distribution),s.median);
  }
});

test('Wilson intervals match reference values and remain informative at zero and all outcomes',()=>{
  const middle=wilsonInterval(5,10);assert.ok(Math.abs(middle.low-.236593090512564)<1e-12);assert.ok(Math.abs(middle.high-.763406909487436)<1e-12);
  const zero=wilsonInterval(0,10),all=wilsonInterval(10,10);
  assert.ok(zero.low<1e-15);assert.ok(Math.abs(zero.high-.277532799862889)<1e-12);
  assert.ok(Math.abs(all.low-(1-zero.high))<1e-12);assert.ok(all.high>1-1e-15);
  assert.ok(wilsonInterval(50,100).high-wilsonInterval(50,100).low<middle.high-middle.low);
  for(const [count,n] of [[0,0],[-1,10],[11,10],[1.5,10],[1,NaN]])assert.equal(wilsonInterval(count,n),null);
});
function record(id,{ratings={},main=A,satisfaction=null,strongest=[],weakest=[],best=[],worst=[],themes={},respondentId='',date='2026-10-26T12:00:00Z',comment=''}={}){
  const r=normalizeRows([{'Submission ID':id,'Submitted at':date,'Respondent ID':respondentId,'What is your main faction?':main}]).records[0];
  Object.assign(r.strength,ratings);return {...r,satisfaction,strongest,weakest,best,worst,factionThemes:{...r.factionThemes,...themes},problems:comment};
}
test('Rating and satisfaction ranges combine with AND and exclude missing ratings',()=>{
  const rows=[record('yes',{ratings:{[A]:6},satisfaction:2}),record('happy',{ratings:{[A]:7},satisfaction:6}),record('missing',{satisfaction:2}),record('other',{ratings:{[A]:3},satisfaction:2})];
  const opinions=[{kind:'rating',faction:A,min:6,max:7},{kind:'satisfaction',min:1,max:3}];
  assert.deepEqual(filterRecords(rows,{opinions}).map(r=>r.id),['yes']);
  assert.equal(matchesOpinions(rows[2],[{kind:'rating',faction:A,min:1,max:3}]),false);
  assert.equal(matchesOpinions(rows[0],[{kind:'rating',faction:A,min:7,max:2}]),false);
});
test('Several faction ranges combine and a new range replaces the same target only',()=>{
  const a={kind:'rating',faction:A,min:6,max:7},b={kind:'rating',faction:B,min:1,max:3};
  const rules=upsertOpinion([a,b],{...a,min:4,max:5});assert.equal(rules.length,2);assert.equal(rules.find(r=>r.faction===B),b);
  assert.equal(matchesOpinions(record('1',{ratings:{[A]:5,[B]:2}}),rules),true);
  assert.equal(matchesOpinions(record('2',{ratings:{[A]:7,[B]:2}}),rules),false);
});
test('Latest browser response is selected before opinion filtering, so old matching answers cannot reappear',()=>{
  const rows=[record('old',{respondentId:'same',date:'2026-10-25T12:00:00Z',ratings:{[A]:7}}),record('new',{respondentId:'same',ratings:{[A]:2}})];
  const opinions=[{kind:'rating',faction:A,min:6,max:7}];assert.equal(filterRecords(rows,{opinions}).length,1);assert.equal(filterRecords(rows,{opinions,deduplicate:true}).length,0);
});
test('Opinion filtering recomputes conditional theme eligibility and written-answer populations',()=>{
  const rows=[record('1',{ratings:{[A]:6},satisfaction:2,strongest:[B],themes:{[B]:['Theme X']},comment:'First'}),record('2',{ratings:{[A]:7},satisfaction:6,strongest:[B],themes:{[B]:['Theme Y']},comment:'Second'}),record('3',{ratings:{[A]:6},satisfaction:2,strongest:[A],themes:{[B]:['Hidden stale answer']},comment:'Third'})];
  const filtered=filterRecords(rows,{opinions:[{kind:'satisfaction',min:1,max:3}]});const c=conditionalThemes(filtered,B);
  assert.equal(c.base,2);assert.equal(c.eligible,1);assert.equal(c.answered,1);assert.deepEqual(c.items,[{name:'Theme X',count:1}]);assert.equal(c.outsideBranch,1);assert.equal(aggregate(filtered).comments.filter(c=>c.type==='Meta').length,2);
});
test('Consensus spread describes observed ratings, is bounded and does not imply agreement from n=1',()=>{
  const rows=[record('1',{ratings:{[A]:1,[B]:4,[C]:5}}),record('2',{ratings:{[A]:7,[B]:4}})];const c=consensus(rows);
  assert.equal(c[0].mean,4);assert.equal(c[0].spread,3);assert.equal(c[1].spread,0);assert.equal(c[2].n,1);assert.equal(c[2].spread,null);assert.equal(c[3].spread,null);
});
test('Duels pair ratings within each submission and preserve ties and unavailable pairs',()=>{
  const rows=[record('1',{ratings:{[A]:7,[B]:2}}),record('2',{ratings:{[A]:3,[B]:3}}),record('3',{ratings:{[A]:1,[B]:4}}),record('4',{ratings:{[A]:7}}),record('5',{ratings:{[B]:1}})];
  const d=pairedDuel(rows,A,B);assert.equal(d.n,3);assert.equal(d.excluded,2);assert.deepEqual([d.higher,d.equal,d.lower],[1,1,1]);assert.equal(d.meanDifference,2/3);assert.equal(d.distribution.reduce((a,b)=>a+b),3);
  const reverse=pairedDuel(rows,B,A);assert.equal(reverse.higher,d.lower);assert.equal(reverse.meanDifference,-d.meanDifference);assert.equal(pairedDuel(rows,A,A).n,0);
});
test('Duel filters select the intended outcome and replacing a reversed pair avoids duplicate conditions',()=>{
  const r=record('1',{ratings:{[A]:6,[B]:2}});assert.equal(matchesOpinions(r,[{kind:'duel',a:A,b:B,outcome:'higher'}]),true);assert.equal(matchesOpinions(r,[{kind:'duel',a:A,b:B,outcome:'equal'}]),false);
  assert.equal(opinionKey({kind:'duel',a:A,b:B}),opinionKey({kind:'duel',a:B,b:A}));assert.equal(upsertOpinion([{kind:'duel',a:A,b:B,outcome:'higher'}],{kind:'duel',a:B,b:A,outcome:'lower'}).length,1);
});
test('Reciprocal matchups retain separate denominators and partition contradictory and omitted nominations',()=>{
  const rows=[record('good',{best:[B]}),record('bad',{worst:[B]}),record('both',{best:[B],worst:[B]}),record('omitted',{best:[C]}),record('blank'),record('other',{main:B,worst:[A]})];
  const a=reciprocalMatchup(rows,A,B),b=reciprocalMatchup(rows,B,A);assert.deepEqual([a.owners,a.n,a.good,a.bad,a.both,a.neither],[5,4,1,1,1,1]);assert.equal(a.good+a.bad+a.both+a.neither,a.n);assert.equal(b.n,1);assert.equal(b.bad,1);
  assert.equal(reciprocalMatchup(rows,A,A).n,0);
});
test('Matchup source filters distinguish good only, bad only, contradictions and non-nomination',()=>{
  const r=record('1',{best:[B],worst:[B]});assert.equal(matchesOpinions(r,[{kind:'matchup',main:A,opponent:B,outcome:'good'}]),false);assert.equal(matchesOpinions(r,[{kind:'matchup',main:A,opponent:B,outcome:'both'}]),true);
  assert.equal(matchesOpinions(record('2',{best:[C]}),[{kind:'matchup',main:A,opponent:B,outcome:'neither'}]),true);assert.equal(matchesOpinions(record('3'),[{kind:'matchup',main:A,opponent:B,outcome:'neither'}]),false);
});
test('Co-nominations count each unordered pair once per answer and do not assume rankings',()=>{
  const rows=[record('1',{strongest:[A,A,B,C]}),record('2',{strongest:[B,A]}),record('3',{strongest:[C]}),record('4')];const n=coNominations(rows);
  assert.equal(n.n,3);assert.equal(n.nodes.find(x=>x.name===A).count,2);assert.equal(n.edges.find(x=>x.a===A&&x.b===B).count,2);assert.equal(n.edges.find(x=>x.a===A&&x.b===C).count,1);assert.equal(n.edges.length,3);
  assert.equal(coNominations(rows,'weakest').n,0);assert.throws(()=>coNominations(rows,'played'),/Unknown/);
});
test('All three selected nominations must occur in one answer; pairwise edges are insufficient',()=>{
  const rows=[record('1',{strongest:[A,B]}),record('2',{strongest:[A,C]}),record('3',{strongest:[B,C]})];assert.equal(coNominations(rows).edges.length,3);
  assert.equal(filterRecords(rows,{opinions:[{kind:'nominations',category:'strongest',factions:[A,B,C]}]}).length,0);
  assert.equal(filterRecords(rows,{opinions:[{kind:'nominations',category:'strongest',factions:[A,B]}]}).length,1);
});
test('Invalid opinion rules fail closed rather than silently expanding the selected group',()=>{
  const r=record('1',{ratings:{[A]:4}});assert.equal(matchesOpinions(r,[{kind:'unknown'}]),false);assert.equal(matchesOpinions(r,[{kind:'nominations',category:'played',factions:[A]}]),false);assert.equal(matchesOpinions(r,[{kind:'nominations',category:'strongest',factions:[]}]),false);
});
