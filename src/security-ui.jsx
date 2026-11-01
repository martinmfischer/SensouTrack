import React,{useEffect,useRef,useState} from 'react';
import {ShieldCheck,LogOut} from 'lucide-react';
import {Modal} from './Modal';
import {api,cloudMode,captchaSiteKey} from './api';

let captchaScript;
function loadCaptcha(){
  if(!captchaScript)captchaScript=new Promise((resolve,reject)=>{if(window.turnstile)return resolve();const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=resolve;script.onerror=()=>{captchaScript=undefined;script.remove();reject(new Error('Verification could not be loaded.'));};document.head.append(script);});
  return captchaScript;
}
export function Turnstile({onToken}){
  const ref=useRef(null),[error,setError]=useState('');
  useEffect(()=>{let active=true,id;
    if(!captchaSiteKey){setError('Sign-in is unavailable until verification is configured.');return;}
    loadCaptcha().then(()=>{if(active)id=window.turnstile.render(ref.current,{sitekey:captchaSiteKey,theme:'light',size:'flexible',callback:token=>{if(active)onToken(token);},'expired-callback':()=>onToken(''),'error-callback':()=>{onToken('');setError('Verification failed. Close this form and try again.');}});}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;if(id!==undefined)window.turnstile?.remove(id);};
  },[]);
  return <div><div ref={ref}/>{error&&<p className="error-box" role="alert">{error}</p>}</div>;
}
export function AccountSecurity({user,onClose,onSignedOut}){
  const [pending,setPending]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[captcha,setCaptcha]=useState(''),[captchaRound,setCaptchaRound]=useState(0);
  async function logout(){setPending(true);try{await api.logout(true);onSignedOut();}catch(e){setError(e.message);}finally{setPending(false);}}
  async function change(event){event.preventDefault();setPending(true);setError('');try{await api.changePassword(Object.fromEntries(new FormData(event.target)));onSignedOut();}catch(e){setError(e.message);}finally{setPending(false);}}
  return <Modal title="Account security." onClose={onClose}><div className="security-status"><ShieldCheck size={24}/><p><strong>Account settings.</strong><br/>{user.email}</p></div><p className="micro">{cloudMode?'Cloud sign-ins stay in memory and are not saved to browser storage. Reloading the app requires a fresh sign-in.':'Sessions lock after 30 minutes of inactivity and expire after 12 hours. Profiles and private notes are encrypted in the local database.'}</p><button className="button secondary full" disabled={pending} onClick={logout}><LogOut size={16}/>Sign out all sessions</button>{cloudMode?<div className="form-stack security-password"><h3>Password recovery</h3><p className="micro">We send the reset link to your verified email address.</p><Turnstile key={captchaRound} onToken={setCaptcha}/><button className="button secondary full" disabled={!captcha||pending} onClick={async()=>{setPending(true);try{await api.reset(user.email,captcha);setMessage('Check your email for the password reset link.');}catch(e){setError(e.message);}finally{setPending(false);setCaptcha('');setCaptchaRound(n=>n+1);}}}>Send password reset email</button></div>:<form className="form-stack security-password" onSubmit={change}><h3>Change password</h3><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/></label><label>New passphrase<input name="password" type="password" autoComplete="new-password" required minLength={15} maxLength={128} placeholder="At least 15 characters"/></label><p className="micro">Changing your password signs out every session.</p><button className="button primary full" disabled={pending}>Change password</button></form>}{error&&<p role="alert" className="error-box">{error}</p>}{message&&<p role="status" className="success-box">{message}</p>}</Modal>;
}
