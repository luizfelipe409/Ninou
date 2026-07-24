import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const rootPackage = JSON.parse(await read('package.json'));
const mobilePackage = JSON.parse(await read('mobile/package.json'));
const appConfig = JSON.parse(await read('mobile/app.json'));
const vercel = JSON.parse(await read('vercel.json'));
const firebaseConfig = JSON.parse(await read('firebase.json'));
const firebase = await read('mobile/src/services/firebase.ts');
const auth = await read('mobile/src/state/auth-context.tsx');
const profile = await read('mobile/src/state/profile-context.tsx');
const preferences = await read('mobile/src/state/preferences-context.tsx');
const routine = await read('mobile/src/state/routine-context.tsx');
const tabs = await read('mobile/src/app/(tabs)/_layout.tsx');
const background = await read('mobile/src/components/ninou-background.tsx');
const rules = await read('firestore.rules');
const accountDeletion = await read('functions/account-deletion.js');

assert.equal(rootPackage.version, '84.1.2');
assert.equal(mobilePackage.version, '84.1.2');
assert.equal(appConfig.expo.version, '84.1.2');
assert.equal(rootPackage.scripts.build, 'npm --prefix mobile run export:web');
assert.equal(mobilePackage.scripts['export:web'], 'expo export --platform web --output-dir dist --clear');
assert.equal(appConfig.expo.web.output, 'static');
assert.equal(appConfig.expo.web.bundler, 'metro');
assert.equal(vercel.outputDirectory, 'mobile/dist');
assert.equal(vercel.installCommand, 'npm --prefix mobile ci');
assert.equal(firebaseConfig.functions.source, 'functions');
assert.equal(firebaseConfig.functions.runtime, 'nodejs22');

for (const legacyPath of ['index.html', 'sw.js', 'js', 'styles']) {
  await assert.rejects(access(new URL(`../${legacyPath}`, import.meta.url), constants.F_OK), undefined, `Runtime legado ainda existe: ${legacyPath}`);
}

assert.match(firebase, /getDoc\(doc\(db, 'users', user\.uid, 'access', 'ninou'\)\)/);
assert.match(firebase, /pointedCandidate/);
assert.match(firebase, /persistCanonicalFamilyPointer/);
assert.match(firebase, /roleVersion: 3/);
assert.match(firebase, /families', familyId, 'profile', 'main'/);
assert.match(firebase, /families', input\.familyId, 'days', input\.dayId/);
assert.match(firebase, /httpsCallable</);
assert.match(firebase, /'deleteMyAccount'/);
assert.match(accountDeletion, /db\.recursiveDelete\(familyRef\)/);
assert.match(accountDeletion, /db\.recursiveDelete\(userRef\)/);
assert.match(accountDeletion, /await auth\.deleteUser\(uid\)/);
assert.match(accountDeletion, /family\.get\('ownerUid'\) !== uid/);
assert.match(auth, /AppState\.addEventListener\('change'/);
assert.match(profile, /ninou\.universal\.profile\.v3/);
assert.match(profile, /fonte canônica em todas as plataformas/);
assert.match(preferences, /ninou\.universal\.preferences\.v3/);
assert.match(preferences, /access\?\.familyId \|\| 'no-family'/);
assert.match(routine, /loadRoutineDays\(access\.familyId\)/);
assert.match(routine, /saveRoutineDay\(\{\s*familyId: access\.familyId/);
assert.match(tabs, /const tabMeta/);
assert.match(tabs, /label: 'Hoje'/);
assert.match(tabs, /label: 'Diário'/);
assert.match(tabs, /label: 'Dados'/);
assert.match(tabs, /label: 'Sons'/);
assert.match(tabs, /label: 'Perfil'/);
assert.match(background, /Animated\.loop/);
assert.match(background, /LinearGradient/);
assert.match(rules, /Caminhos legados pessoais não são fontes ativas/);
assert.match(rules, /match \/days\/\{dayId\}[\s\S]*allow write: if isGlobalAdmin\(\);/);
assert.match(rules, /match \/profile\/\{docId\}[\s\S]*allow write: if isGlobalAdmin\(\);/);

console.log('Arquitetura universal: web, iOS e Android usam o mesmo aplicativo e o mesmo contrato Firebase.');
