import {loadEnv} from 'vite';
import {validateCloudConfig} from './cloud-config.mjs';
validateCloudConfig({...loadEnv('cloud',process.cwd(),'VITE_'),...process.env});
console.log('Public cloud configuration validated. Apply SECURITY.md before launch.');
