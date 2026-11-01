import {readFile,mkdir,writeFile,readdir,unlink} from 'node:fs/promises';
import {publicPublication} from '../survey-dashboard/publication.mjs';
const snapshot=JSON.parse(await readFile(new URL('../survey-dashboard/private/responses.json',import.meta.url),'utf8'));
let ledger;
try{ledger=JSON.parse(await readFile(new URL('../survey-dashboard/private/public-text-review.json',import.meta.url),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const files=publicPublication(snapshot,ledger),root=new URL('../public/survey/',import.meta.url);
await mkdir(new URL('groups/',root),{recursive:true});
for(const name of await readdir(new URL('groups/',root)))if(/^(?:faction|experience|day)-\d+\.json$/.test(name))await unlink(new URL('groups/'+name,root));
for(const [name,value] of Object.entries(files))await writeFile(new URL(name,root),JSON.stringify(value));
await writeFile(new URL('publication.json',root),JSON.stringify({schema:1,refreshedAt:snapshot.syncedAt,total:snapshot.records.length,base:'/survey/',mode:'published'}));
console.log(JSON.stringify({submissions:snapshot.records.length,refreshedAt:snapshot.syncedAt,reviewedTexts:files['texts.json'].texts.length,pendingTexts:files['texts.json'].pending,groups:files['groups.json'].groups.length}));
