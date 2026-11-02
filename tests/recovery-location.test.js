import test from 'node:test';
import assert from 'node:assert/strict';
import {withoutRecoveryFlag} from '../src/recovery-location.mjs';

test('completed or dismissed recovery does not reopen on reload and preserves unrelated navigation',()=>{
  assert.equal(withoutRecoveryFlag('https://app.sensoutrack.pages.dev/?recovery=1#reset'),'/');
  assert.equal(withoutRecoveryFlag('https://app.sensoutrack.pages.dev/?recovery=1&code=example#games'),'/?code=example#games');
  assert.equal(withoutRecoveryFlag('https://app.sensoutrack.pages.dev/#report'),'/#report');
});
