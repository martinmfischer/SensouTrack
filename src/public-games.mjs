// Anonymous read-only data path: this module never creates an authentication client.
export async function publicGames(url,key,signal,fetcher=fetch){
  const games=[];
  for(let start=0;;start+=1000){
    const response=await fetcher(`${url}/rest/v1/public_games?select=payload&order=id&offset=${start}&limit=1000`,{
      headers:{apikey:key},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal
    });
    if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('Community results are temporarily unavailable. Please try again.');
    const rows=await response.json();
    if(!Array.isArray(rows))throw new Error('Community results could not be read.');
    for(const {payload:g} of rows)games.push({
      ownFaction:g.ownFaction,ownTheme:g.ownTheme,opponentFaction:g.opponentFaction,opponentTheme:g.opponentTheme,
      date:g.date,scenario:g.scenario,rice:g.rice,format:g.format,ownVp:g.ownVp,opponentVp:g.opponentVp
    });
    if(rows.length<1000)break;
  }
  return games;
}
