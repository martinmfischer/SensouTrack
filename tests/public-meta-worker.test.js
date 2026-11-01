import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('former survey preview redirects to the canonical site and survey mutations are rejected',async()=>{
 const source=(await readFile(new URL('../scripts/public-meta-worker.mjs',import.meta.url),'utf8')).replace('__SENSOU_BASE_HEADERS__','{}').replace('__SENSOU_CMP_ACTIVE__','false');
 const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
 const redirect=await worker.fetch(new Request('https://survey.sensoutrack.pages.dev/survey/?test=1'),{});
 assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'https://sensoutrack.pages.dev/survey/?test=1');
 assert.equal((await worker.fetch(new Request('https://sensoutrack.pages.dev/survey/summary.json',{method:'POST'}),{})).status,405);
});

test('public HTML gets a fresh matching nonce; legal pages retain strict static headers; CMP permissions are explicit',async()=>{
  const originalRewriter=globalThis.HTMLRewriter;
  globalThis.HTMLRewriter=class{
    on(tag,handler){assert.equal(tag,'script');this.handler=handler;return this;}
    async transform(response){
      const body=(await response.text()).replaceAll('<script',()=>{
        let nonce;this.handler.element({setAttribute(name,value){assert.equal(name,'nonce');nonce=value;}});
        return `<script nonce="${nonce}"`;
      });
      return new Response(body,response);
    }
  };
  try{
    const headers={'Content-Security-Policy':"default-src 'self'; script-src 'self'; connect-src 'self' https://example.supabase.co; img-src 'self' data:; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cache-Control':'no-store'};
    const source=await readFile(new URL('../scripts/public-meta-worker.mjs',import.meta.url),'utf8');
    for(const cmpActive of [false,true]){
      const code=source.replace('__SENSOU_BASE_HEADERS__',JSON.stringify(headers)).replace('__SENSOU_CMP_ACTIVE__',JSON.stringify(cmpActive));
      const worker=(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;
      const env={ASSETS:{async fetch(request){
        if(new URL(request.url).pathname==='/'){assert.equal(request.headers.has('if-none-match'),false);assert.equal(request.headers.has('if-modified-since'),false);}
        return new Response('<!doctype html><script src="/assets/main.js"></script>',{headers:{'content-type':'text/html','etag':'old-asset'}});
      }}};
      let previousNonce;
      for(let i=0;i<2;i++){
        const response=await worker.fetch(new Request('https://sensoutrack.pages.dev/',{headers:{'if-none-match':'old-asset','if-modified-since':'yesterday'}}),env);
        const policy=response.headers.get('content-security-policy');const nonce=policy.match(/'nonce-([^']+)'/)[1];
        assert.ok(nonce.length>=24);assert.notEqual(nonce,previousNonce);previousNonce=nonce;
        assert.ok((await response.text()).includes(`nonce="${nonce}"`));assert.ok(policy.includes("'strict-dynamic'"));
        assert.ok(!policy.includes("'unsafe-inline'"));assert.ok(!policy.includes("'unsafe-eval'"));assert.ok(policy.includes("frame-ancestors 'none'"));
        assert.equal(response.headers.get('referrer-policy'),cmpActive?'strict-origin':'no-referrer');
        assert.equal(response.headers.has('etag'),false);assert.equal(response.headers.get('cache-control'),'no-store');
        assert.equal(policy.includes('*.googlesyndication.com'),cmpActive);
      }
      const legal=await worker.fetch(new Request('https://sensoutrack.pages.dev/privacy'),env);
      assert.equal(legal.headers.get('content-security-policy'),headers['Content-Security-Policy']);
      assert.equal(legal.headers.get('referrer-policy'),'no-referrer');
    }
  }finally{globalThis.HTMLRewriter=originalRewriter;}
});
