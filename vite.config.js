import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {readFile,writeFile} from 'node:fs/promises';
import {validateCloudConfig} from './scripts/cloud-config.mjs';
import {adsenseVerification} from './scripts/adsense-config.mjs';
import {advertisingNotice} from './scripts/advertising-notices.mjs';
export default defineConfig(({mode})=>{
  const env=loadEnv(mode==='meta'?'cloud':mode,process.cwd(),'VITE_');
  const cloud=Boolean(env.VITE_SUPABASE_URL||env.VITE_SUPABASE_PUBLISHABLE_KEY||env.VITE_TURNSTILE_SITE_KEY);
  const origin=cloud?validateCloudConfig({...env,...process.env}):'';
  const adsense=adsenseVerification(env);
  const cmpActive=env.VITE_ADSENSE_ACTIVE==='true',adsServing=env.VITE_ADSENSE_SERVING==='true';
  if(adsServing&&!cmpActive)throw new Error('Ad serving requires the configured Google CMP.');
  if(cmpActive&&!adsense)throw new Error('Google CMP requires the real public AdSense publisher ID.');
  return {define:mode==='meta'?{'import.meta.env.VITE_ADSENSE_ACTIVE':JSON.stringify(cmpActive),'import.meta.env.VITE_ADSENSE_SERVING':JSON.stringify(adsServing),'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(env.VITE_SUPABASE_URL),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY)}:{},plugins:[react(),{name:'restrict-authentication-origin',transformIndexHtml:{order:'pre',handler(html){
    return {html:mode==='meta'?html.replace('/src/main.jsx','/src/public-meta.jsx').replace(/\s*<link rel="manifest"[^>]*>/,''):html,tags:adsense?[{tag:'meta',attrs:{name:'google-adsense-account',content:adsense.publisher},injectTo:'head'}]:[]};
  }},async writeBundle(options){
    const file=new URL('./public/_headers',import.meta.url);
    const content=(await readFile(file,'utf8')).replace('https://*.supabase.co',origin||"'self'");
    await writeFile(`${options.dir}/_headers`,content);
    if(adsense)await writeFile(`${options.dir}/ads.txt`,adsense.adsTxt);
    if(cmpActive){
      for(const [file,language] of [['privacy.html','en'],['datenschutz.html','de']]){
        const path=`${options.dir}/${file}`;let html=await readFile(path,'utf8');
        if(!html.includes('<section id="advertising">'))throw new Error('Privacy notice advertising section is missing.');
        html=html.replace(/<section id="advertising">[\s\S]*?<\/section>/,advertisingNotice(language,adsServing));
        html=html.replace('No advertising or website analytics scripts currently load.','Google manages consent on the public meta home page; ad requests require consent and activation.').replace('Aktuell laden wir keine Werbe- oder Website-Analyseskripte.','Google verwaltet Einwilligungen auf der öffentlichen Meta-Startseite; Werbeanfragen benötigen Einwilligung und Freischaltung.');
        html=html.replace('We do not connect to Google Fonts.','The Google consent service and ad frames can load their own resources from Google.').replace('es gibt keine Verbindung zu Google Fonts.','Google-Einwilligung und Anzeigenframes können eigene Ressourcen von Google laden.');
        await writeFile(path,html);
      }
    }
    if(mode==='meta'){
      const baseHeaders=Object.fromEntries(content.split('\n/sw.js')[0].split('\n').slice(1).filter(line=>line.trim()).map(line=>{const [name,...value]=line.trim().split(':');return [name,value.join(':').trim()];}));
      const worker=(await readFile(new URL('./scripts/public-meta-worker.mjs',import.meta.url),'utf8')).replace('__SENSOU_BASE_HEADERS__',JSON.stringify(baseHeaders)).replace('__SENSOU_CMP_ACTIVE__',JSON.stringify(cmpActive));
      await writeFile(`${options.dir}/_worker.js`,worker);
      await writeFile(`${options.dir}/_routes.json`,JSON.stringify({version:1,include:['/','/survey/*'],exclude:[]}));
    }
  }}],build:{target:'es2022',...(mode==='meta'?{rollupOptions:{input:{main:'index.html',survey:'survey/index.html'}}}:{})}};
});
