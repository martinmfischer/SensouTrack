export function surveyPage(hash){
  const page=hash.replace(/^#/,'').split('/')[0];
  return page==='synthesis'?'comments':page;
}

export function writtenResponseRoute(hash){
  const [page,section,...rest]=hash.replace(/^#/,'').split('/');
  if(page==='synthesis')return {view:'synthesis',evidence:[section,...rest]};
  if(page!=='comments')return null;
  if(section==='topics')return {view:'topics',evidence:[]};
  if(section==='factions')return {view:'factions',faction:rest[0]||'',evidence:[]};
  return {view:'synthesis',evidence:section==='synthesis'?rest:[]};
}

export const factionSlug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const sourceAnswerUrl=(kind,id)=>'#comments/synthesis/'+kind+'/'+encodeURIComponent(id);
