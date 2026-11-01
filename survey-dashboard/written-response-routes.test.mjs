import test from 'node:test';
import assert from 'node:assert/strict';
import {FACTIONS} from './analysis.mjs';
import {surveyPage,writtenResponseRoute,sourceAnswerUrl,factionSlug} from './written-response-routes.mjs';

test('Written response navigation preserves old evidence links and separates the three views',()=>{
  const legacy=writtenResponseRoute('#synthesis/topic/theme-value/Faction%20%26%20Matchups');
  const current=writtenResponseRoute(sourceAnswerUrl('topic','theme-value')+'/Faction%20%26%20Matchups');
  assert.deepEqual(current,legacy);
  assert.equal(surveyPage('#synthesis/answer/a'),'comments');
  assert.deepEqual(writtenResponseRoute('#comments'),{view:'synthesis',evidence:[]});
  assert.equal(writtenResponseRoute('#comments/topics').view,'topics');
  assert.deepEqual(writtenResponseRoute('#comments/factions/ito-clan'),{view:'factions',faction:'ito-clan',evidence:[]});
  assert.equal(writtenResponseRoute('#cross'),null);
  assert.equal(new Set(FACTIONS.map(factionSlug)).size,15);
});
