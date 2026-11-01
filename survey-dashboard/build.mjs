import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
await build({configFile:false,root:fileURLToPath(new URL('.',import.meta.url)),plugins:[react()],build:{target:'es2022',outDir:'dist'}});
