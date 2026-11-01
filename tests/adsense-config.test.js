import test from 'node:test';
import assert from 'node:assert/strict';
import {adsenseVerification} from '../scripts/adsense-config.mjs';

test('AdSense ownership verification stays absent until a valid public publisher ID is configured',()=>{
  assert.equal(adsenseVerification({}),null);
  assert.equal(adsenseVerification({VITE_ADSENSE_PUBLISHER_ID:' '}),null);
  const configured=adsenseVerification({VITE_ADSENSE_PUBLISHER_ID:'ca-pub-1234567890123456'});
  assert.equal(configured.publisher,'ca-pub-1234567890123456');
  assert.equal(configured.adsTxt,'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
  for(const value of ['pub-1234567890123456','ca-pub-123','<script>','ca-pub-1234567890123456\nother']){
    assert.throws(()=>adsenseVerification({VITE_ADSENSE_PUBLISHER_ID:value}));
  }
});
