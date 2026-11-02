import test from 'node:test';
import assert from 'node:assert/strict';
import redirect from '../scripts/legacy-account-redirect.mjs';
import {accountOrigin,statsOrigin,calculatorOrigin} from '../src/site-links.mjs';
test('account and public pages use separate origins and the legacy host redirects without losing recovery parameters',()=>{
 assert.notEqual(accountOrigin,statsOrigin);
 assert.equal(new URL(accountOrigin).hostname,'app.sensoutrack.pages.dev');
 assert.equal(calculatorOrigin,'https://sensoucalc.pages.dev');
 const response=redirect.fetch(new Request('https://sensoutrack.the-zj.workers.dev/?recovery=1&code=example'));
 assert.equal(response.status,302);
 assert.equal(response.headers.get('location'),accountOrigin+'/?recovery=1&code=example');
 assert.equal(response.headers.get('cache-control'),'no-store');
 const odd=redirect.fetch(new Request('https://sensoutrack.the-zj.workers.dev//example.com/'));
 assert.equal(new URL(odd.headers.get('location')).origin,accountOrigin);
});
