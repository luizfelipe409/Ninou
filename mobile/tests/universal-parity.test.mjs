import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const firebase = await read('../src/services/firebase.ts');
const profile = await read('../src/state/profile-context.tsx');
const preferences = await read('../src/state/preferences-context.tsx');
const auth = await read('../src/state/auth-context.tsx');
const layout = await read('../src/app/(tabs)/_layout.tsx');
const orbit = await read('../src/components/routine-orbit.tsx');
const appConfig = JSON.parse(await read('../app.json'));
const packageConfig = JSON.parse(await read('../package.json'));

assert.equal(appConfig.expo.web.output, 'static');
assert.equal(packageConfig.scripts['export:web'], 'expo export --platform web --output-dir dist --clear');
assert.match(firebase, /const \[pointerSnapshot, familySnapshots\] = await Promise\.all/);
assert.match(firebase, /pointedCandidate \|\| \[\.\.\.candidates\]\.sort\(compareFamilyAccess\)/);
assert.match(firebase, /persistCanonicalFamilyPointer/);
assert.match(firebase, /member\.name \|\| member\.displayName \|\| account\.caregiverName/);
assert.match(profile, /families\/\{familyId\}\/profile\/main|fonte canônica/);
assert.match(preferences, /ninou\.universal\.preferences\.v3/);
assert.match(auth, /nextState === 'active'/);
assert.match(layout, /PremiumTabBar/);
assert.match(orbit, /groupRoutineMarkerEvents/);
assert.match(orbit, /clusterSatelliteTime/);
console.log('Paridade universal de dados, menus e órbita validada.');
