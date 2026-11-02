import test from 'node:test';
import {build} from 'vite';
import {writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

test('survey UI keeps withheld values distinct from zero and empty groups distinct from overall data',async()=>{
  const temporary=await mkdtemp(resolve('node_modules/.sensou-ui-'));
  const output=join(temporary,'regression.mjs');
  try{
    const bundle=await build({configFile:false,logLevel:'error',build:{ssr:'tests/fixtures/survey-ui-regression.jsx',write:false,minify:false}});
    await writeFile(output,bundle.output.find(item=>item.type==='chunk'&&item.isEntry).code);
    await import(pathToFileURL(output).href+'?run='+Date.now());
  }finally{await rm(temporary,{recursive:true,force:true});}
});
