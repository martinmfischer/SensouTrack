import {apiToRows,normalizeRows} from './analysis.mjs';
export const FORM_ID='2jEY7L';

export async function downloadTally(token,{fetcher=fetch,formId=FORM_ID,onRaw=async()=>{}}={}) {
  async function get(path) {
    for(let attempt=0;attempt<3;attempt++){
      let response;
      try{response=await fetcher(`https://api.tally.so${path}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});}
      catch{throw new Error('Tally is currently unavailable. The last successful snapshot is preserved.');}
      if(response.status===429&&attempt<2){const seconds=Math.min(10,Math.max(1,Number(response.headers.get('retry-after'))||2));await new Promise(r=>setTimeout(r,seconds*1000));continue;}
      if(!response.ok)throw new Error(({401:'The Tally key is invalid or has expired.',403:'The Tally key cannot access this survey.',404:'The survey was not found on Tally.',429:'Tally’s request limit was reached. Please try syncing again later.'})[response.status]||`Tally returned HTTP ${response.status}. The last successful snapshot is preserved.`);
      try{return await response.json();}catch{throw new Error('Tally did not return valid JSON.');}
    }
  }
  const form=await get(`/forms/${formId}`);
  const questions=new Map(),submissions=[];let page=1,expected=null;
  while(true){
    const data=await get(`/forms/${formId}/submissions?filter=completed&limit=500&page=${page}`);
    if(!Array.isArray(data.questions)||!Array.isArray(data.submissions)||typeof data.hasMore!=='boolean')throw new Error('Unexpected Tally data format. The last successful snapshot is preserved.');
    for(const q of data.questions)questions.set(q.id,q);
    for(const s of data.submissions)if(s.formId!==formId)throw new Error('Tally returned data from another form. Import aborted.');
    submissions.push(...data.submissions);
    expected=data.totalNumberOfSubmissionsPerFilter?.completed??expected;
    if(!data.hasMore)break;
    if(!data.submissions.length||page>=100)throw new Error('Tally pagination is incomplete. The last successful snapshot is preserved.');
    page++;
  }
  const blocks=form.blocks||form.form?.blocks||[];
  await onRaw({formId,downloadedAt:new Date().toISOString(),questions:[...questions.values()],blocks,submissions:submissions.map(({previewUrl,pdfUrl,...s})=>s)});
  const normalized=normalizeRows(apiToRows([...questions.values()],submissions,blocks));
  if(normalized.duplicates||(Number.isFinite(expected)&&expected!==normalized.records.length))throw new Error('The data changed during download. Please sync again; the previous snapshot is preserved.');
  if(normalized.records.length&&!normalized.records.some(r=>Object.values(r.strength).some(v=>v!==null)||r.mainFaction||r.strongest.length||r.satisfaction!==null))throw new Error('The Tally responses could not be mapped. The previous snapshot is preserved.');
  return {formId,records:normalized.records,duplicates:normalized.duplicates,source:'api',syncedAt:new Date().toISOString(),pages:page};
}
