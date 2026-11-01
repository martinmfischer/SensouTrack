import test from 'node:test';
import {build} from 'vite';
import {writeFile,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

test('survey UI keeps withheld values distinct from zero and empty groups distinct from overall data',async()=>{
  const output=resolve('qa/survey-ui-regression.bundle.mjs');
  try{
    const bundle=await build({configFile:false,logLevel:'error',build:{ssr:'qa/survey-ui-regression.jsx',write:false,minify:false}});
    await writeFile(output,bundle.output.find(item=>item.type==='chunk'&&item.isEntry).code);
    await import(pathToFileURL(output).href+'?run='+Date.now());
  }finally{await unlink(output).catch(()=>{});}
});
