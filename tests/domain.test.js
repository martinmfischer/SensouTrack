import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGame,standings,matchup,personalStats,filterGames,demoGames,localDate,csv } from '../src/domain.js';
const game={ownFaction:'ito-clan',ownTheme:'Cold Blood',opponentFaction:'minimoto-clan',opponentTheme:'The Finest Steel',ownVp:2,opponentVp:1,date:localDate(),scenario:'Ryodo',rice:100,format:'Casual',notes:'Private notes'};
test('VP validation and faction/theme combinations reject invalid inputs',()=>{
  assert.equal(validateGame(game).ownVp,2);
  for(const patch of [{ownVp:3,opponentVp:1},{ownVp:1.5},{ownVp:''},{ownTheme:'The Finest Steel'},{date:'2026-02-30'},{rice:101},{scenario:'Invented scenario'},{notes:'x'.repeat(501)}]) assert.throws(()=>validateGame({...game,...patch}));
  assert.equal(validateGame({...game,ownTheme:'Brotherhood'}).ownTheme,'Brotherhood');
});
test('standings handle both perspectives, draws, mirrors and theme mirrors',()=>{
  const draw={...game,ownVp:1,opponentVp:1};
  const reverse={...game,ownFaction:game.opponentFaction,opponentFaction:game.ownFaction,ownTheme:game.opponentTheme,opponentTheme:game.ownTheme};
  const mirror={...game,opponentFaction:game.ownFaction,opponentTheme:game.ownTheme};
  const data=[game,draw,reverse,mirror];
  const ito=standings(data).find(r=>r.faction==='ito-clan');
  assert.deepEqual([ito.games,ito.wins,ito.draws,ito.losses],[3,1,1,1]);
  assert.equal(ito.winrate,1/3); assert.equal(ito.playrate,.5);
  assert.equal(standings([mirror]).length,0);assert.equal(standings([mirror],true).length,0);
  assert.equal(standings([{...mirror,opponentTheme:'The Blessed'}],true).length,2);
  assert.equal(matchup(data,'ito-clan','minimoto-clan').winrate,1/3);
  assert.equal(matchup(data,'ito-clan','ito-clan'),null);
  assert.equal(matchup(data,'ito-clan','shiho-clan'),null);
  assert.equal(personalStats([]).winrate,null);
  assert.equal(personalStats(data).games,4);
});
test('demo isolation, filtering and CSV privacy',()=>{
  assert.equal(demoGames().length,384);demoGames().forEach(g=>validateGame(g));
  assert.equal(filterGames([game],{rice:'75'}).length,0);
  assert.equal(filterGames([game],{faction:'minimoto-clan',rice:'100'}).length,1);
  assert.ok(!csv([game]).includes('Private notes'));
  assert.ok(!csv([game]).includes('user_id'));
});
