import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../public/survey/',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const manifest=JSON.parse(await read('freeze.json'));
if(manifest.mode!=='frozen'||manifest.closed!==true||manifest.total!==165)throw Error('Invalid final survey manifest');
for(const [name,hash]of Object.entries(manifest.files)){
 if(!/^(summary|texts|groups)\.json$|^groups\/(faction|experience|day)-\d+\.json$/.test(name))throw Error('Invalid frozen file');
 if(createHash('sha256').update(await read(name)).digest('hex')!==hash)throw Error('Frozen survey file changed: '+name);
}
const publication=JSON.parse(await read('publication.json'));
if(publication.mode!=='frozen'||publication.closed!==true||publication.revision!==manifest.revision||publication.total!==manifest.total)throw Error('Frozen publication mismatch');
console.log('Final survey verified: '+manifest.total+' submissions, '+Object.keys(manifest.files).length+' fixed data files.');
