export function withoutRecoveryFlag(value){
  const url=new URL(value);
  url.searchParams.delete('recovery');
  if(url.hash==='#reset')url.hash='';
  return url.pathname+url.search+url.hash;
}
