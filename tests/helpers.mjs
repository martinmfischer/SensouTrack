import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
export async function workspaceServer({dev=false,seed}={}){
  const dir=await mkdtemp(path.join(tmpdir(),'sensou-security-'));
  if(seed)await seed(dir);
  const port=19000+Math.floor(Math.random()*8000),base=`http://127.0.0.1:${port}`;
  let child;
  const env={...process.env,HOST:'127.0.0.1',PORT:String(port),DATA_DIR:dir,SECURITY_KEY_FILE:path.join(dir,'keys','master.key')};
  async function start(){
    return new Promise((resolve,reject)=>{
      let diagnostics='';
      child=spawn(process.execPath,['server/index.js',...(dev?['--dev']:[])],{cwd:process.cwd(),env,stdio:['ignore','pipe','pipe']});
      const timeout=setTimeout(()=>{child.kill();reject(new Error('Test server did not start.'));},15000);
      child.stdout.on('data',data=>{if(String(data).includes('Sensou ready')){clearTimeout(timeout);resolve();}});
      child.stderr.on('data',data=>{diagnostics+=data;});
      child.once('error',e=>{clearTimeout(timeout);reject(e);});child.once('exit',code=>{clearTimeout(timeout);if(code)reject(new Error(diagnostics));});
    });
  }
  const stop=()=>child?.exitCode===null?new Promise(resolve=>{child.once('exit',resolve);child.kill();}):Promise.resolve();
  async function cleanup(){await stop();if(path.resolve(dir).startsWith(path.resolve(tmpdir())+path.sep)&&path.basename(dir).startsWith('sensou-security-'))await rm(dir,{recursive:true,force:true});}
  function client(){
    const jar={};let csrf;
    async function call(route,method='GET',data,extra={}){
      if(method!=='GET'&&method!=='HEAD'&&!csrf){const response=await call('/auth/csrf');csrf=response.body.token;}
      const res=await fetch(base+'/api'+route,{method,headers:{Cookie:Object.entries(jar).map(([k,v])=>`${k}=${v}`).join('; '),...(method!=='GET'?{Origin:base,'X-CSRF-Token':csrf}:{}),...(data!==undefined?{'Content-Type':'application/json'}:{}),...extra},body:data!==undefined?JSON.stringify(data):undefined});
      for(const value of res.headers.getSetCookie()){const [key,val]=value.split(';')[0].split('=');jar[key]=val;}
      return {status:res.status,body:method==='HEAD'?null:await res.json(),headers:res.headers};
    }
    return {call,jar};
  }
  return {dir,port,base,env,start,stop,cleanup,client};
}
