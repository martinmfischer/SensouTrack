// Require affirmative consent even outside CMP coverage. Unknown never enables ads.
// https://support.google.com/adsense/answer/9804260
export function permitsNonPersonalizedAd(data,success){
  const purposes=[1,2,7,9,10];
  return success===true&&data?.cmpStatus==='loaded'&&data.gdprApplies===true
    &&data.isServiceSpecific===true&&['tcloaded','useractioncomplete'].includes(data.eventStatus)
    &&typeof data.tcString==='string'&&data.tcString.length>0
    &&data.vendor?.consents?.[755]===true
    &&purposes.every(id=>data.purpose?.consents?.[id]===true&&data.publisher?.restrictions?.[id]?.[755]!==0);
}
