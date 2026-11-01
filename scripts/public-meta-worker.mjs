// HTML nonce policy and canonical navigation for the former survey preview.
const baseHeaders=__SENSOU_BASE_HEADERS__;
const cmpActive=__SENSOU_CMP_ACTIVE__;
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.hostname==='survey.sensoutrack.pages.dev')return Response.redirect('https://sensoutrack.pages.dev'+url.pathname+url.search,308);
    const path=new URL(request.url).pathname;
    if(path.startsWith('/survey/')&&request.method!=='GET'&&request.method!=='HEAD')return new Response(null,{status:405,headers:{...baseHeaders,Allow:'GET, HEAD'}});
    const root=new URL(request.url).pathname==='/';
    const assetRequest=new Request(request);
    if(root){assetRequest.headers.delete('if-none-match');assetRequest.headers.delete('if-modified-since');}
    const asset=await env.ASSETS.fetch(assetRequest);
    const response=new Response(asset.body,asset);
    for(const [name,value] of Object.entries(baseHeaders))response.headers.set(name,value);
    if(!root||!asset.headers.get('content-type')?.includes('text/html')||asset.status!==200)return response;
    const nonce=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18))));
    let policy=baseHeaders['Content-Security-Policy'].replace(/script-src[^;]+/,`script-src 'nonce-${nonce}' 'strict-dynamic'`);
    if(cmpActive){
      // Script trust flows from the nonced app/AdSense tags, rather than a rolling
      // script-domain allowlist. No unsafe-inline or unsafe-eval script permission.
      policy=policy.replace(/connect-src[^;]+/,"$& https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://www.gstatic.com")
        .replace(/frame-src[^;]+/,"frame-src https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google")
        .replace(/img-src[^;]+/,"img-src 'self' data: blob: https:");
      response.headers.set('Referrer-Policy','strict-origin');
    }
    response.headers.set('Content-Security-Policy',policy);
    response.headers.set('Cache-Control','no-store');
    response.headers.delete('etag');response.headers.delete('last-modified');response.headers.delete('content-length');
    return new HTMLRewriter().on('script',{element(element){element.setAttribute('nonce',nonce);}}).transform(response);
  }
};
