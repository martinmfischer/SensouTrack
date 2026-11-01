import { randomBytes, createHash, createHmac, createCipheriv, createDecipheriv, timingSafeEqual, scrypt, hkdfSync } from 'node:crypto';
import { mkdir, open, readFile, chmod } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {execFileSync} from 'node:child_process';

export class HttpError extends Error {
  constructor(status,message,code='REQUEST_REJECTED'){super(message);this.status=status;this.code=code;}
}
export const digest=value=>createHash('sha256').update(value).digest('hex');
export const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const kdf=promisify(scrypt);
const parameters={N:131072,r:8,p:1,maxmem:160*1024*1024};
let activeHashes=0;
async function derive(password,salt,options=parameters){
  if(activeHashes>=2)throw new HttpError(503,'Please retry in a moment.','AUTH_BUSY');
  activeHashes++;
  try{return await kdf(password,salt,64,options);}finally{activeHashes--;}
}
export function validatePassword(password){
  if(typeof password!=='string'||password.length<15||password.length>128)throw new HttpError(400,'Use a password or passphrase of 15–128 characters.');
  if(/^(.)\1+$/.test(password)||/^(password|qwerty|123456|letmein|sensou|bushido)[\W\d]*$/i.test(password))throw new HttpError(400,'Choose a less predictable passphrase.');
}
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');return `scrypt:131072:8:1:${salt}:${(await derive(password,salt)).toString('hex')}`;}
export async function verifyPassword(password,stored){
  const parts=stored?.split(':')??[];
  const modern=parts.length===6&&parts[0]==='scrypt'&&parts[1]==='131072'&&parts[2]==='8'&&parts[3]==='1';
  const legacy=parts.length===2&&/^[a-f0-9]{32}$/.test(parts[0])&&/^[a-f0-9]{128}$/.test(parts[1]);
  const salt=modern?parts[4]:legacy?parts[0]:'0'.repeat(32);
  const expected=modern?parts[5]:legacy?parts[1]:'0'.repeat(128);
  const actual=(await derive(password,salt,legacy?{N:16384,r:8,p:1,maxmem:32*1024*1024}:parameters)).toString('hex');
  return {valid:(modern||legacy)&&equal(actual,expected),needsUpgrade:legacy};
}
function windowsKey(operation,bytes){
  // DPAPI binds the stored key to the Windows user. Secret bytes travel only via
  // child-process stdin/stdout, never command arguments, logs or a plaintext file.
  const script=`$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Security;$bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd());$entropy=[Text.Encoding]::UTF8.GetBytes('Sensou local key v1');$result=[System.Security.Cryptography.ProtectedData]::${operation}($bytes,$entropy,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Convert]::ToBase64String($result))`;
  try{return Buffer.from(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{input:bytes.toString('base64'),encoding:'utf8',windowsHide:true,timeout:15000}).trim(),'base64');}
  catch{throw new Error('Windows user key protection failed. Use the original Windows account and profile.');}
}
export async function loadVault(file,{mustExist=false}={}){
  await mkdir(path.dirname(file),{recursive:true,mode:0o700});
  if(!mustExist){
    try{
      // Do not alter directory ACLs: sandboxed/restricted Windows tokens may need
      // additional existing ACL entries, and SECURITY_KEY_FILE can have any parent.
      const raw=randomBytes(32),stored=process.platform==='win32'?Buffer.from('dpapi1:'+windowsKey('Protect',raw).toString('base64')):raw;
      const handle=await open(file,'wx',0o600);try{await handle.writeFile(stored);await handle.sync();}finally{await handle.close();}
    }catch(e){if(e.code!=='EEXIST')throw e;}
  }
  let stored;try{stored=await readFile(file);}catch{throw new Error('Encryption key missing. Restore the existing key; do not generate a replacement for encrypted data.');}
  if(stored.length>8192)throw new Error('Invalid encryption key.');
  const key=process.platform==='win32'&&stored.toString('ascii',0,7)==='dpapi1:'?windowsKey('Unprotect',Buffer.from(stored.toString().slice(7),'base64')):stored;
  if(process.platform==='win32'&&stored.length===32)throw new Error('A plaintext legacy key needs an explicit protected migration.');
  if(key.length!==32)throw new Error('Invalid encryption key.');
  await chmod(file,0o600);
  const encryptionKey=Buffer.from(hkdfSync('sha256',key,Buffer.alloc(0),'sensou/encryption/v1',32));
  const macKey=Buffer.from(hkdfSync('sha256',key,Buffer.alloc(0),'sensou/authentication/v1',32));
  const mac=value=>createHmac('sha256',macKey).update(value).digest('hex');
  return {
    lookup:email=>`hmac:${mac('email:'+email)}`,
    seal(value,context){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey,iv);cipher.setAAD(Buffer.from(context));const encrypted=Buffer.concat([cipher.update(Buffer.from(value)),cipher.final()]);return `enc1:${Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url')}`;},
    open(value,context,binary=false){if(!value.startsWith('enc1:'))throw new Error('Unencrypted private field.');const data=Buffer.from(value.slice(5),'base64url'),decipher=createDecipheriv('aes-256-gcm',encryptionKey,data.subarray(0,12));decipher.setAAD(Buffer.from(context));decipher.setAuthTag(data.subarray(12,28));const plaintext=Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]);return binary?plaintext:plaintext.toString();},
    csrf(){const payload=`${Date.now()}.${randomBytes(24).toString('hex')}`;return `${payload}.${mac('csrf:'+payload)}`;},
    validCsrf(token){if(typeof token!=='string'||token.length>160||token.split('.').length!==3)return false;const [issued,nonce,signature]=token.split('.');return /^\d{13}$/.test(issued)&&/^[a-f0-9]{48}$/.test(nonce)&&Date.now()-Number(issued)>=0&&Date.now()-Number(issued)<3600000&&equal(signature,mac(`csrf:${issued}.${nonce}`));}
  };
}
export function headers({dev=false}={}){
  return {
    'X-Content-Type-Options':'nosniff','X-Frame-Options':dev?'SAMEORIGIN':'DENY',
    'Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin',
    'Content-Security-Policy':`default-src 'self'; script-src 'self'${dev?" 'unsafe-inline'":''}; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://*.supabase.co${dev?' ws://localhost:* ws://127.0.0.1:*':''}; frame-ancestors ${dev?"'self'":"'none'"}; object-src 'none'; base-uri 'none'; form-action 'self'; worker-src 'self'`
  };
}
