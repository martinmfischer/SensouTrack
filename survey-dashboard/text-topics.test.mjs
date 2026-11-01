import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeTopics,topicTokens,commentMatchesTerm,matchedTopicWords,topicCsv,TOPIC_RULES} from './text-topics.mjs';

const answer=(id,text,type='Meta')=>({id,text,type,experience:'Experienced',faction:'Ito Clan'});
test('Topics count each submission once across questions and repeated words',()=>{
  const r=analyzeTopics([answer('1','Preordain preordain PREORDAIN.'),answer('1','Preordain','Themes'),answer('2','Preordain is useful.')]);
  const t=r.topics.find(t=>t.id==='auto-includes');assert.equal(r.answers,3);assert.equal(r.respondents,2);assert.equal(t.answers,3);assert.equal(t.respondents,2);
  assert.equal(r.terms.find(t=>t.term==='preordain').respondents,2);
});
test('Duplicate submission/question objects do not inflate counts; blank answers are excluded',()=>{
  const a=answer('1','Rules and rulings');const r=analyzeTopics([a,a,answer('2','Rules'),answer('3','  ')]);
  assert.equal(r.answers,2);assert.equal(r.topics.find(t=>t.id==='rules').respondents,2);
});
test('Whole words prevent substring matches; punctuation and case are normalised',()=>{
  const rule=TOPIC_RULES.find(t=>t.id==='activations');assert.deepEqual(matchedTopicWords('PASS-TOKENS.',rule),['pass tokens']);
  const r=analyzeTopics([answer('1','A tax is a restriction'),answer('2','Taxonomy should not match this rule')],{minPeople:1});
  assert.equal(r.topics.find(t=>t.id==='theme-benefits').respondents,1);
});
test('Negated statements are mentions, not an inferred sentiment or agreement',()=>{
  const r=analyzeTopics([answer('1','Shooting is not a problem.'),answer('2','Shooting is a problem.')]);
  const t=r.topics.find(t=>t.id==='ranged');assert.equal(t.respondents,2);assert.equal('sentiment' in t,false);assert.equal('agreement' in t,false);
});
test('One answer can match multiple topics; unmatched answers remain available',()=>{
  const r=analyzeTopics([answer('1','Preordain and pass tokens'),answer('2','Preordain with pass tokens'),answer('3','A personal reflection without matching terms.')]);
  assert.equal(r.groupedAnswers,2);assert.equal(r.topics.find(t=>t.id==='activations').answers,2);assert.equal(r.topics.find(t=>t.id==='auto-includes').answers,2);assert.equal(r.unassigned[0].id,'3');
});
test('Filtering the input changes denominators without silently dropping unmatched text',()=>{
  const docs=[answer('1','Preordain'),answer('2','Preordain'),answer('3','Something unrelated','Themes')];
  const r=analyzeTopics(docs.filter(c=>c.type==='Meta'));assert.equal(r.respondents,2);assert.equal(r.answers,2);
  const narrow=analyzeTopics([docs[0]],{minPeople:2});assert.equal(narrow.respondents,1);assert.equal(narrow.topics.length,0);assert.equal(narrow.groupedAnswers,1);
});
test('Changing minimum topic size only changes displayed topics, not coverage or originals',()=>{
  const docs=[answer('1','Rules.'),answer('2','Rules.')];const a=analyzeTopics(docs),b=analyzeTopics(docs,{minPeople:3});
  assert.equal(a.topics.length,1);assert.equal(b.topics.length,0);assert.equal(a.groupedAnswers,b.groupedAnswers);assert.deepEqual(a.allTopics,b.allTopics);
});
test('Example extracts are copied from an actual member, with no generated claims',()=>{
  const docs=[answer('1','Intro. '.repeat(80)+'Preordain is mandatory here. '+'More context. '.repeat(60)),answer('2','Preordain is a choice.')],before=structuredClone(docs);
  const r=analyzeTopics(docs),t=r.topics.find(t=>t.id==='auto-includes');assert.ok(t.members.includes(t.representative));assert.ok(t.representative.text.includes(t.excerpt.replace(/^…|…$/g,'')));
  assert.ok(t.excerpt.includes('Preordain'));assert.ok(t.excerpt.length<=342);assert.ok(t.excerpt.startsWith('…'));assert.deepEqual(docs,before);
});
test('Recurring wording is respondent based and its drilldown uses the same normalisation',()=>{
  const docs=[answer('1','pass tokens pass tokens'),answer('2','Pass tokens')];const r=analyzeTopics(docs);
  assert.equal(r.terms.find(t=>t.term==='pass token').respondents,2);assert.ok(docs.every(c=>commentMatchesTerm(c,'pass token')));assert.ok(topicTokens('Spieler und rules').includes('rule'));
});
test('Summary CSV includes denominators and limits, without respondent IDs or extracts',()=>{
  const r=analyzeTopics([answer('private-id-1','Preordain private-comment-one'),answer('private-id-2','Preordain private-comment-two')]);const csv=topicCsv(r,'Biggest meta problems');
  assert.ok(csv.includes('Respondents with text'));assert.ok(csv.includes('not agreement'));assert.ok(!csv.includes('private-id'));assert.ok(!csv.includes('private-comment'));
});
