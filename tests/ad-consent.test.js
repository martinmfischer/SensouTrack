import test from 'node:test';
import assert from 'node:assert/strict';
import {permitsNonPersonalizedAd} from '../src/ad-consent.mjs';

test('ad requests require explicit Google and purpose consent; errors, pending state and legitimate interest do not suffice',()=>{
  const granted={cmpStatus:'loaded',gdprApplies:true,isServiceSpecific:true,eventStatus:'useractioncomplete',tcString:'provided-by-the-certified-cmp',vendor:{consents:{755:true}},purpose:{consents:{1:true,2:true,7:true,9:true,10:true}}};
  assert.equal(permitsNonPersonalizedAd(granted,true),true);
  assert.equal(permitsNonPersonalizedAd({...granted,eventStatus:'tcloaded'},true),true);
  for(const data of [undefined,{}, {...granted,cmpStatus:'error'}, {...granted,eventStatus:'cmpuishown'}, {...granted,eventStatus:'loading'}, {...granted,gdprApplies:false}, {...granted,isServiceSpecific:false}, {...granted,tcString:''}, {...granted,vendor:{consents:{755:false}}}, {...granted,publisher:{restrictions:{2:{755:0}}}}])assert.equal(permitsNonPersonalizedAd(data,true),false);
  assert.equal(permitsNonPersonalizedAd(granted,false),false);
  assert.equal(permitsNonPersonalizedAd(granted,undefined),false);
  for(const purpose of [1,2,7,9,10])assert.equal(permitsNonPersonalizedAd({...granted,purpose:{consents:{...granted.purpose.consents,[purpose]:false},legitimateInterests:{[purpose]:true}}},true),false);
});
