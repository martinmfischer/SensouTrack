import {draftStorage} from './draft-storage.mjs';
const cloudUrl=import.meta.env.VITE_SUPABASE_URL;
const cloudKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloudMode=Boolean(cloudUrl&&cloudKey);
export const captchaSiteKey=import.meta.env.VITE_TURNSTILE_SITE_KEY||'';
if(Boolean(cloudUrl)!==Boolean(cloudKey)||cloudKey?.startsWith('sb_secret_'))throw new Error('Invalid public authentication configuration.');
// Do not restore legacy sessions from localStorage. A reload requires a fresh cloud sign-in.
if(cloudMode){const key=`sb-${new URL(cloudUrl).hostname.split('.')[0]}-auth-token`;try{localStorage.removeItem(key);sessionStorage.removeItem(key);}catch{}}
const supabase=cloudMode?(await import('@supabase/supabase-js')).createClient(cloudUrl,cloudKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const unwrap=result=>{if(result.error)throw new Error(result.error.code==='23505'?'You have already reported this game.':'Authentication or data request failed. Please check your details and try again.');return result.data;};
const shape=u=>({id:u.id,email:u.email,name:String(u.user_metadata?.name||u.email?.split('@')[0]||'Player').slice(0,40)});
let csrfToken,csrfTime=0;
async function request(route,method='GET',data,retry=true){
  const mutation=!['GET','HEAD'].includes(method);
  if(mutation&&(!csrfToken||Date.now()-csrfTime>3000000)){const value=await request('/auth/csrf');csrfToken=value.token;csrfTime=Date.now();}
  let response;try{response=await fetch(`/api${route}`,{method,credentials:'same-origin',cache:'no-store',headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...(mutation?{'X-CSRF-Token':csrfToken}:{})},body:data!==undefined?JSON.stringify(data):undefined});}catch{throw new Error('Connection lost. Please try again.');}
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('The game server is unavailable.');
  const result=await response.json();
  if(response.status===403&&result.code==='CSRF_INVALID'&&retry){csrfToken=null;return request(route,method,data,false);}
  if(!response.ok)throw new Error(result.error||'Request failed.');return result;
}
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('sensou-auth'):null;
function cleared(){draftStorage.clear();window.dispatchEvent(new Event('sensou-signout'));}
channel?.addEventListener('message',event=>{if(event.data==='signed-out'){if(supabase)supabase.auth.signOut({scope:'local'}).catch(()=>{});cleared();}});
async function cloudUser(){
  const {data,error}=await supabase.auth.getUser();if(error||!data.user)return null;
  if(!data.user.email_confirmed_at||!unwrap(await supabase.rpc('account_security_status'))){await supabase.auth.signOut({scope:'local'});return null;}
  return shape(data.user);
}
export const api={
  async me(){return supabase?cloudUser():(await request('/auth/me')).user;},
  async auth(mode,input){
    if(!supabase)return request(`/auth/${mode}`,'POST',input);
    const {name,email,password,captchaToken}=input;
    if(mode==='register'){
      if(password.length<15||password.length>128)throw new Error('Use a passphrase of 15–128 characters.');
      const result=unwrap(await supabase.auth.signUp({email,password,options:{captchaToken,data:{name},emailRedirectTo:location.origin}}));
      return result.session?{user:await cloudUser()}:{message:'Check your email to confirm registration. If you already have an account, sign in or use password recovery.'};
    }
    unwrap(await supabase.auth.signInWithPassword({email,password,options:{captchaToken}}));return {user:await cloudUser()};
  },
  async logout(all=false){
    if(supabase)unwrap(await supabase.auth.signOut({scope:all?'global':'local'}));else await request(all?'/auth/logout-all':'/auth/logout','POST',{});
    csrfToken=null;cleared();channel?.postMessage('signed-out');
  },
  async games(mine=false){
    if(!supabase)return (await request(`/games${mine?'?mine=1':''}`)).games;
    const user=mine?await cloudUser():null;if(mine&&!user)throw new Error('Please sign in to view your games.');
    const games=[];
    for(let start=0;;start+=1000){let query=supabase.from(mine?'games':'public_games').select('id,payload').order('id').range(start,start+999);if(mine)query=query.eq('user_id',user.id);const rows=unwrap(await query);games.push(...rows.map(row=>({...row.payload,id:row.id})));if(rows.length<1000)break;}
    return games.sort((a,b)=>b.date.localeCompare(a.date));
  },
  async save(game){if(supabase)return unwrap(await supabase.from('games').insert({payload:game}));return request('/games','POST',game);},
  async remove(id){if(supabase)unwrap(await supabase.from('games').delete().eq('id',id));else await request(`/games/${id}`,'DELETE');},
  async reset(email,captchaToken){unwrap(await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/?recovery=1',captchaToken}));},
  async updatePassword(password){if(password.length<15||password.length>128)throw new Error('Use a passphrase of 15–128 characters.');const user=await cloudUser();if(!user)throw new Error('Open a valid password reset link from your email.');unwrap(await supabase.auth.updateUser({password}));await this.logout(true);},
  async changePassword(input){
    if(!supabase){await request('/auth/password','POST',input);cleared();channel?.postMessage('signed-out');return;}
    throw new Error('For a hosted account, use the verified email recovery flow.');
  },
  listen(callback){const handler=()=>callback(null,'SIGNED_OUT');window.addEventListener('sensou-signout',handler);const subscription=supabase?.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')callback(null,event);else if(event==='SIGNED_OUT')callback(null,event);});return()=>{window.removeEventListener('sensou-signout',handler);subscription?.data.subscription.unsubscribe();};}
};
