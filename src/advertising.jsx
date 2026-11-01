import React,{useEffect,useRef,useState} from 'react';
import {permitsNonPersonalizedAd} from './ad-consent.mjs';

const enabled=import.meta.env.VITE_ADSENSE_ACTIVE===true;
const serving=import.meta.env.VITE_ADSENSE_SERVING===true;
const publicOrigin='https://sensoutrack.pages.dev';
const slot='1048168333';

// Imported only by the separate public meta entry. Activation additionally needs
// reviewed public headers/notices, a published Google CMP and site approval.
export function useAdvertising(){
  const [allowed,setAllowed]=useState(false),[ready,setReady]=useState(false);
  const ad=useRef(null),requested=useRef(false);
  useEffect(()=>{
    const query=new URLSearchParams(location.search);
    const consentPreview=query.get('fc')==='alwaysshow'&&query.get('fctype')==='gdpr'&&[...query.keys()].every(key=>['fc','fctype'].includes(key));
    if(!enabled||location.origin!==publicOrigin||location.pathname!=='/'||(location.search&&!consentPreview)
      ||!['','#main','#about','#privacy'].includes(location.hash))return;
    const publisher=document.querySelector('meta[name="google-adsense-account"]')?.content;
    if(!/^ca-pub-\d{16}$/.test(publisher||''))return;
    let active=true,listener;
    const ads=window.adsbygoogle=window.adsbygoogle||[];
    // Official paused bootstrap loads scripts for Google's CMP, but no ad request.
    // Existing Google cookies may be read: see ADS-OPTIONS.md, not a script-free CMP.
    window.adsbygoogle.pauseAdRequests=1;ads.requestNonPersonalizedAds=1;
    const fc=window.googlefc=window.googlefc||{};
    fc.callbackQueue=fc.callbackQueue||[];
    fc.callbackQueue.push({CONSENT_API_READY:()=>{
      if(!active||typeof window.__tcfapi!=='function')return;
      window.__tcfapi('addEventListener',2,(data,success)=>{
        if(!active)return;listener=data?.listenerId;
        setReady(success===true&&data?.gdprApplies===true);
        if(requested.current&&data?.eventStatus==='useractioncomplete'){
          window.adsbygoogle.pauseAdRequests=1;location.reload();return;
        }
        const permit=permitsNonPersonalizedAd(data,success);
        if(!permit){
          window.adsbygoogle.pauseAdRequests=1;setAllowed(false);
          // Reload after withdrawal to stop previously executed ad code. Opening
          // options alone pauses/hides the unit without creating a reload loop.
          if(requested.current&&data?.eventStatus!=='cmpuishown')location.reload();
        }else setAllowed(true);
      });
    }});
    const script=document.createElement('script');
    script.async=true;script.crossOrigin='anonymous';
    script.nonce=document.querySelector('script[nonce]')?.nonce||'';
    script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}`;
    script.dataset.privacyTreatments='disablePersonalization';
    script.onerror=()=>{if(active){window.adsbygoogle.pauseAdRequests=1;setReady(false);setAllowed(false);}};
    document.head.append(script);
    return()=>{
      active=false;window.adsbygoogle.pauseAdRequests=1;
      if(listener!==undefined&&typeof window.__tcfapi==='function')window.__tcfapi('removeEventListener',2,()=>{},listener);
    };
  },[]);
  useEffect(()=>{
    if(!enabled||!serving||!allowed||!ad.current||requested.current)return;
    const ads=window.adsbygoogle;if(!ads)return;
    try{requested.current=true;ads.requestNonPersonalizedAds=1;ads.pauseAdRequests=0;ads.push({});}
    catch{window.adsbygoogle.pauseAdRequests=1;setAllowed(false);}
  },[allowed]);
  function choices(){
    if(!ready)return;
    const ads=window.adsbygoogle;if(ads)window.adsbygoogle.pauseAdRequests=1;
    setAllowed(false);
    window.googlefc.callbackQueue.push({CONSENT_API_READY:()=>window.googlefc.showRevocationMessage()});
  }
  const publisher=enabled?document.querySelector('meta[name="google-adsense-account"]')?.content:'';
  return {
    unit:enabled&&serving&&allowed?<section className="community-ad" aria-label="Advertisement"><span>Advertisement</span><ins ref={ad} className="adsbygoogle" style={{display:'block'}} data-ad-client={publisher} data-ad-slot={slot} data-ad-format="horizontal" data-full-width-responsive="true"/></section>:null,
    privacyControl:enabled&&ready?<button className="ad-privacy-control" onClick={choices}>Privacy and cookie settings</button>:null
  };
}
