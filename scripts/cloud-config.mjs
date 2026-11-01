export function validateCloudConfig(env){
  const url=env.VITE_SUPABASE_URL,key=env.VITE_SUPABASE_PUBLISHABLE_KEY,turnstile=env.VITE_TURNSTILE_SITE_KEY;
  if(!url||!key)throw new Error('Cloud deployment requires the Supabase project URL and public key. See HOSTING.md.');
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw new Error('Expected an HTTPS Supabase project URL.');
  if(key.startsWith('sb_secret_'))throw new Error('A secret Supabase key must never enter a browser build.');
  if(!key.startsWith('sb_publishable_')){
    let role;try{role=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role;}catch{}
    if(role!=='anon')throw new Error('Only a publishable or legacy anon key may enter a browser build.');
  }
  if(!turnstile||!/^[a-z0-9_-]{20,100}$/i.test(turnstile))throw new Error('Configure Supabase CAPTCHA and set its public Turnstile site key before deployment.');
  return url;
}
