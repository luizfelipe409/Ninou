import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const required = [
  'mobile/src/app/_layout.tsx',
  'mobile/src/app/(tabs)/_layout.tsx',
  'mobile/src/components/ninou-background.tsx',
  'mobile/src/components/routine-orbit.tsx',
  'mobile/src/services/firebase.ts',
  'mobile/public/privacidade.html',
  'mobile/public/termos.html',
  'mobile/public/suporte.html',
  'firestore.rules',
  'vercel.json',
];
for (const path of required) assert.ok((await stat(new URL(`../${path}`, import.meta.url))).isFile(), `Ausente: ${path}`);

const firebase = await read('mobile/src/services/firebase.ts');
const release = await read('mobile/src/config/release.ts');
const vercel = await read('vercel.json');
const app = await read('mobile/app.json');
assert.match(release, /NINOU_VERSION = '84\.1\.1'/);
assert.match(release, /NINOU_DATA_CONTRACT_VERSION = 3/);
assert.match(firebase, /projectId: process\.env\.EXPO_PUBLIC_FIREBASE_PROJECT_ID \|\| 'ninou-3c936'/);
assert.match(firebase, /browserLocalPersistence/);
assert.match(firebase, /getReactNativePersistence\(AsyncStorage\)/);
assert.match(vercel, /"outputDirectory": "mobile\/dist"/);
assert.match(app, /"output": "static"/);
assert.ok(!vercel.includes('/sw.js'), 'A web universal não deve publicar o Service Worker legado.');
console.log('Validação estrutural universal concluída.');
