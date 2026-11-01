import {timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {downloadTally} from './tally.mjs';
import {publicPublication} from './publication.mjs';

const publicBucket='sensou-survey',reviewBucket='sensou-survey-review';
const filePattern=/^(?:summary|texts|groups)\.json$|^groups\/(?:faction|experience|day)-\d+\.json$/;
export async function refreshPublication(env,{fetcher=fetch,download=downloadTally}={}){
  if(!env.TALLY_API_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Refresh secrets missing.');
  const origin=new URL(env.SUPABASE_URL);
  if(origin.protocol!=='https:'||!origin.hostname.endsWith('.supabase.co'))throw Error('Invalid storage origin.');
  const headers={Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,apikey:env.SUPABASE_SERVICE_ROLE_KEY};
  async function storage(path,options={}){const r=await fetcher(origin.origin+'/storage/v1/'+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(30000),redirect:'error'});if(!r.ok)throw Error('SURVEY_STORAGE_'+r.status);return r;}
  // Review state is private. Any missing/invalid state stops the refresh.
  const ledger=await (await storage('object/'+reviewBucket+'/ledger.json')).json();
  const snapshot=await download(env.TALLY_API_KEY,{fetcher});
  const files=publicPublication(snapshot,ledger);
  const revision=Date.now()+'-'+crypto.randomUUID();
  const previousResponse=await fetcher(origin.origin+'/storage/v1/object/'+publicBucket+'/publication.json',{headers,signal:AbortSignal.timeout(30000),redirect:'error'});
  if(!previousResponse.ok&&previousResponse.status!==404){
    const error=await previousResponse.clone().json().catch(()=>({}));
    // Storage wraps a missing object in HTTP 400 with a 404 statusCode.
    if(!(previousResponse.status===400&&String(error.statusCode)==='404'&&error.message==='Object not found'))throw Error('SURVEY_MANIFEST_'+previousResponse.status);
  }
  const previous=previousResponse.ok?await previousResponse.json():null;
  const put=(name,value)=>storage('object/'+publicBucket+'/'+name,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'true','cache-control':'max-age=0'},body:JSON.stringify(value)});
  for(const [name,value] of Object.entries(files))await put('releases/'+revision+'/'+name,value);
  const meta={schema:1,revision,base:'/survey/releases/'+revision+'/',mode:'hourly',refreshedAt:snapshot.syncedAt,total:snapshot.records.length,files:Object.keys(files),previous:previous?.revision?{revision:previous.revision,files:previous.files}:null};
  // Publish the pointer last: visitors see one complete revision throughout.
  await put('publication.json',meta);
  const obsolete=previous?.previous;let cleanupPending=false;
  if(obsolete&&/^[a-zA-Z0-9-]+$/.test(obsolete.revision)&&Array.isArray(obsolete.files)){
    const prefixes=obsolete.files.filter(f=>filePattern.test(f)).map(f=>'releases/'+obsolete.revision+'/'+f);
    if(prefixes.length)try{await storage('object/'+publicBucket,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes})});}catch{cleanupPending=true;}
  }
  return {refreshedAt:meta.refreshedAt,total:meta.total,reviewedTexts:files['texts.json'].texts.length,pendingTexts:files['texts.json'].pending,cleanupPending};
}

export async function handleRefresh(request,env,deps){
  const received=request.headers.get('authorization')||'',expected='Bearer '+env.SURVEY_SYNC_TOKEN;
  const valid=typeof env.SURVEY_SYNC_TOKEN==='string'&&env.SURVEY_SYNC_TOKEN.length>=32&&Buffer.byteLength(received)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(received),Buffer.from(expected));
  if(!valid)return Response.json({error:'Unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
  if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405,headers:{Allow:'POST'}});
  try{return Response.json(await refreshPublication(env,deps),{headers:{'Cache-Control':'no-store'}});}
  catch(error){const code=/^SURVEY_[A-Z0-9_]+$/.test(error?.message)?error.message:'SURVEY_REFRESH_FAILED';console.error(code);return Response.json({error:'Survey refresh failed. The previous publication is preserved.',code},{status:503,headers:{'Cache-Control':'no-store'}});}
}
