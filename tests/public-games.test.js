import test from 'node:test';
import assert from 'node:assert/strict';
import {publicGames} from '../src/public-games.mjs';

test('public meta fetch has no account credentials and retains only public game fields',async()=>{
  let calls=0;
  const rows=await publicGames('https://example.supabase.co','public-key',undefined,async(url,options)=>{
    calls++;assert.match(url,/\/rest\/v1\/public_games\?/);assert.equal(options.credentials,'omit');
    assert.deepEqual(options.headers,{apikey:'public-key'});assert.equal(options.referrerPolicy,'no-referrer');
    return {ok:true,headers:new Headers({'content-type':'application/json'}),json:async()=>[{payload:{ownFaction:'a',opponentFaction:'b',ownVp:2,opponentVp:0,email:'private',notes:'secret',user_id:'account'}}]};
  });
  assert.equal(calls,1);assert.equal(rows[0].ownVp,2);
  for(const key of ['email','notes','user_id'])assert.equal(key in rows[0],false);
  await assert.rejects(publicGames('https://example.supabase.co','public-key',undefined,async()=>({ok:false})),/unavailable/);
});
