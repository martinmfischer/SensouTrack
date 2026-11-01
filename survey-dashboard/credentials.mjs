import {spawn} from 'node:child_process';
import process from 'node:process';
import {Buffer} from 'node:buffer';

// ProtectData through Windows' built-in SecureString/DPAPI. The token only travels via stdin.
export function dpapi(value,decrypt=false){
  const command=decrypt?"$s=ConvertTo-SecureString ([Console]::In.ReadToEnd());$p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);try{[Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p))}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)}":"$s=ConvertTo-SecureString ([Console]::In.ReadToEnd()) -AsPlainText -Force;[Console]::Out.Write((ConvertFrom-SecureString $s))";
  // PowerShell 7's inherited module path prevents Windows PowerShell loading its own security module.
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>key.toUpperCase()!=='PSMODULEPATH'));
  return new Promise((resolve,reject)=>{
    const child=spawn('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{env,windowsHide:true,stdio:['pipe','pipe','pipe']});
    let result='';const timeout=setTimeout(()=>{child.kill();reject(new Error('Windows key storage did not respond in time.'));},15000);
    child.stdout.on('data',d=>result+=d);child.stderr.resume();
    child.stdin.on('error',()=>{});
    child.on('error',()=>{clearTimeout(timeout);reject(new Error('Windows key storage is unavailable.'));});
    child.on('close',code=>{clearTimeout(timeout);code===0&&result.trim()?resolve(result.trim()):reject(new Error('Windows key storage could not be read.'));});
    child.stdin.end(value);
  });
}
