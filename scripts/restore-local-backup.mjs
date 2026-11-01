import {readFile,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {loadVault} from '../server/security.js';
const [backup,output]=process.argv.slice(2);
if(!backup||!output)throw new Error('Usage: node scripts/restore-local-backup.mjs <encrypted-backup> <NEW-output.sqlite>');
const target=path.resolve(output),live=path.resolve(process.env.DATA_DIR||'data','sensou.sqlite');
if(target===live)throw new Error('Restore to a new file. Never overwrite a live database.');
const vault=await loadVault(process.env.SECURITY_KEY_FILE||'.local-secrets/master.key',{mustExist:true});
const plaintext=vault.open(await readFile(backup,'utf8'),'database-backup',true);
if(plaintext.subarray(0,15).toString()!=='SQLite format 3')throw new Error('The backup is not a SQLite database.');
await writeFile(target,plaintext,{flag:'wx',mode:0o600});
let db;
try{
  db=new DatabaseSync(target,{readOnly:true});
  if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Restored database failed integrity verification.');
}catch(e){db?.close();await unlink(target);throw e;}
db.close();console.log('Restored to the new file and verified database integrity. Treat the restored file as private.');
