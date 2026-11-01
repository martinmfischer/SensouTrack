import test from 'node:test';
import assert from 'node:assert/strict';
import {FACTIONS,parseCsv,normalizeRows,apiToRows,summary,aggregate,filterRecords,day} from './analysis.mjs';
import {crossTable,ratingCell,ownershipComparison,conditionalThemes} from './cross-analysis.mjs';

const [A,B,C]=FACTIONS;
const matrix='How strong is each faction? (1 = very weak, 4 = average, 7 = very strong)';
const main='What is your main faction?',strong='Which factions are strongest? (Up to three)',weak='Which factions are weakest? (Up to three)';
function record(id,extra={}){return normalizeRows([{'Submission ID':id,'Submitted at':'2026-10-26T10:00:00Z',[main]:A,...extra}]).records[0];}

test('CSV keeps quoted commas, escaped quotes, line breaks, BOM and empty final fields',()=>{
  const rows=parseCsv('\uFEFFSubmission ID,What is your main faction?,Comment,Empty\r\nabc,Cult of Yurei,"one, two\n""three""",\r\n');
  assert.equal(rows[0].Comment,'one, two\n"three"');assert.equal(rows[0].Empty,'');
  assert.equal(parseCsv('Submission ID;What is your main faction?\nx;Ito Clan')[0][main],C);
});
test('Malformed imports fail instead of shifting columns',()=>{
  assert.throws(()=>parseCsv('Submission ID,What is your main faction?\na,Ito Clan,extra'),/number of columns/);
  assert.throws(()=>parseCsv('Submission ID,What is your main faction?\na,"Ito Clan'),/Unclosed/);
  assert.throws(()=>parseCsv('Submission ID,Submission ID,What is your main faction?\na,a,Ito Clan'),/Duplicate/);
  assert.throws(()=>parseCsv('Name,Score\na,7'),/Bushido/);
});
test('Missing experience is distinct from skipping and cannot become a zero',()=>{
  const r=record('1',{[`${matrix} [${A}]`]:'Not enough experience',[`${matrix} [${B}]`]:'7',[`${matrix} [${C}]`]:'8'});
  assert.equal(r.strength[A],null);assert.equal(r.strength[B],7);assert.equal(r.strengthStatus[A],'noExperience');assert.equal(r.strengthStatus[C],'invalid');
  assert.deepEqual(summary([null,undefined,1,7]),{n:2,mean:4,median:4,distribution:[1,0,0,0,0,0,1]});
});
test('Actual Tally matrix contract resolves full field titles and UUID choices',()=>{
  const questions=[{id:'matrix',title:matrix,fields:[{uuid:'rowA',title:`${matrix} [${A}]`},{uuid:'rowB',title:`${matrix} [${B}]`}]},{id:'main',title:main}];
  const subs=[{id:'one',isCompleted:true,submittedAt:'2026-10-26T10:00:00Z',responses:[{questionId:'matrix',answer:{rowA:['7'],rowB:['Not enough experience']}},{questionId:'main',answer:['choiceA']}]},{id:'partial',isCompleted:false,responses:[]}];
  const rows=apiToRows(questions,subs,[{uuid:'choiceA',payload:{text:A}}]);
  assert.equal(rows.length,1);const r=normalizeRows(rows).records[0];assert.equal(r.mainFaction,A);assert.equal(r.strength[A],7);assert.equal(r.strengthStatus[B],'noExperience');
  subs[0].responses[0].answer={unrecognized:['5']};assert.throws(()=>apiToRows(questions,subs),/matrix row/);
});
test('Nominations do not imply a ranking; explicit rankings use fixed 3/2/1 points',()=>{
  const rows=[record('1',{[strong]:`${A}, ${B}`}),record('2',{[strong]:`${A}, ${B}`, 'Rank your selected strongest factions (1 = strongest)':`${B}, ${A}`})];
  const a=aggregate(rows);assert.equal(a.factions[0].strongest,2);assert.equal(a.factions[0].strongPoints,2);assert.equal(a.factions[1].strongPoints,3);assert.equal(a.rankedStrong,1);
});
test('Conditional themes exclude people who never nominated the faction, even if hidden answers persist',()=>{
  const field=`Which themes are strongest for ${A}? (Up to three)`;
  const rows=[record('1',{[strong]:A,[field]:'Theme X, Theme Y'}),record('2',{[strong]:A,[field]:'Not enough experience'}),record('3',{[strong]:A}),record('4',{[strong]:B,[field]:'Theme X'})];
  const c=conditionalThemes(rows,A);assert.deepEqual([c.base,c.eligible,c.answered,c.noExperience,c.skipped,c.outsideBranch],[4,3,1,1,1,1]);assert.equal(c.items[0].count,1);
  const a=aggregate(rows).selectedThemes[0];assert.equal(a.eligible,3);assert.equal(a.answered,1);assert.equal(a.items.find(t=>t.name==='Theme X').count,1);
  assert.ok(rows[3].flags.includes('Theme response outside the conditional selection'));
});
test('Cross-table cells use per-question denominators, with real zero distinct from missing',()=>{
  const rows=[record('1',{[strong]:A,[`${matrix} [${A}]`]:'7'}),record('2',{[strong]:B,[`${matrix} [${A}]`]:'Not enough experience'}),record('3')];
  const c=ratingCell(rows,A,'strongest');assert.equal(c.value,.5);assert.equal(c.denominator,2);assert.equal(c.people,3);
  assert.equal(ratingCell(rows,C,'strongest').value,0);assert.equal(ratingCell([],C,'strongest').value,null);
  const r=crossTable(rows)[0].cells[0];assert.equal(r.n,1);assert.equal(r.value,7);assert.deepEqual(r.missing,{noExperience:1,skipped:1,invalid:0});
});
test('Owner comparison uses the same matrix question and excludes unknown main factions',()=>{
  const rows=[record('1',{[`${matrix} [${A}]`]:'7','How strong is your main faction in the current meta?':'1'}),record('2',{[main]:B,[`${matrix} [${A}]`]:'3'}),record('3',{[main]:'',[`${matrix} [${A}]`]:'1'})];
  const c=ownershipComparison(rows)[0];assert.equal(c.own.mean,7);assert.equal(c.other.mean,3);assert.equal(c.other.n,1);assert.equal(c.gap,4);
  assert.equal(crossTable(rows).at(-1).people,1);
});
test('Filters recompute conditional populations and experience groups',()=>{
  const exp='How would you rate your Bushido experience?',field=`Which themes are strongest for ${A}? (Up to three)`;
  const rows=[record('1',{[strong]:A,[field]:'Theme X',[exp]:'Beginner'}),record('2',{[strong]:A,[field]:'Theme Y',[exp]:'Experienced',[main]:B})];
  const filtered=filterRecords(rows,{experience:'Experienced'});const c=conditionalThemes(filtered,A,'others');assert.equal(c.base,1);assert.equal(c.items[0].name,'Theme Y');assert.equal(c.experience[2].answered,1);
  assert.equal(crossTable(filtered,'experience','strongest').find(r=>r.name==='Experienced').cells[0].value,1);
});
test('Matchup percentages count people, not selections',()=>{
  const rows=[record('1',{'Which factions are your best matchups? (Up to three)':`${B}, ${C}`}),record('2',{'Which factions are your worst matchups? (Up to three)':B}),record('3')];
  const row=aggregate(rows).matchups[0];assert.equal(row.n,2);assert.equal(row.cells[1].net,0);assert.equal(row.cells[2].net,.5);assert.equal(row.owners,3);
});
test('Contradictions are retained with flags; response ID duplicates are removed',()=>{
  const row={'Submission ID':'one','Submitted at':'2026-10-26',[main]:A,[strong]:A,[weak]:A};
  const n=normalizeRows([row,row]);assert.equal(n.duplicates,1);assert.equal(n.records.length,1);assert.ok(n.records[0].flags.includes('Contradiction: Factions'));
  assert.equal(filterRecords(n.records,{excludeFlagged:true}).length,0);
});
test('Browser deduplication keeps the latest without collapsing missing respondent IDs',()=>{
  const rows=[record('1',{'Respondent ID':'browser','Submitted at':'2026-10-25T10:00:00Z'}),record('2',{'Respondent ID':'browser'}),record('3'),record('4')];
  assert.deepEqual(filterRecords(rows,{deduplicate:true}).map(r=>r.id),['2','3','4']);
});
test('Berlin day grouping handles UTC midnight and daylight-saving boundary',()=>{
  assert.equal(day('2026-10-25T23:30:00Z'),'2026-10-26');assert.equal(day('2026-10-25 23:30:00'),'2026-10-25');
  assert.equal(filterRecords([record('1',{'Submitted at':'2026-10-25T23:30:00Z'})],{from:'2026-10-26',to:'2026-10-26'}).length,1);
});
