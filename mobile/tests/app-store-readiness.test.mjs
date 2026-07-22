import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const appConfig = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8'));
const packageConfig = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const infoPlist = await readFile(new URL('../ios/Ninou/Info.plist', import.meta.url), 'utf8');
const project = await readFile(new URL('../ios/Ninou.xcodeproj/project.pbxproj', import.meta.url), 'utf8');
const icon = await readFile(new URL('../assets/images/ninou-icon.png', import.meta.url));

function pngSize(buffer) {
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

assert.equal(appConfig.expo.version, '83.0.2');
assert.equal(packageConfig.version, '83.0.2');
assert.equal(appConfig.expo.ios.bundleIdentifier, 'com.ninou.app');
assert.equal(appConfig.expo.ios.buildNumber, '90');
assert.equal(appConfig.expo.android.versionCode, 90);
assert.ok(appConfig.expo.android.blockedPermissions.includes('android.permission.RECORD_AUDIO'));
assert.ok(!appConfig.expo.android.permissions.includes('android.permission.RECORD_AUDIO'));

const audioPlugin = appConfig.expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-audio');
assert.ok(audioPlugin, 'expo-audio deve usar configuração explícita');
assert.equal(audioPlugin[1].microphonePermission, false);
assert.equal(audioPlugin[1].recordAudioAndroid, false);
assert.equal(audioPlugin[1].enableBackgroundPlayback, true);
assert.equal(audioPlugin[1].enableBackgroundRecording, false);

assert.ok(!infoPlist.includes('NSMicrophoneUsageDescription'));
assert.ok(infoPlist.includes('<string>$(MARKETING_VERSION)</string>'));
assert.ok(infoPlist.includes('<string>$(CURRENT_PROJECT_VERSION)</string>'));
assert.ok(infoPlist.includes('<key>LSMinimumSystemVersion</key>\n	<string>16.4</string>'));
assert.match(project, /MARKETING_VERSION = 83\.0\.2;/);
assert.match(project, /CURRENT_PROJECT_VERSION = 90;/);
assert.deepEqual(pngSize(icon), { width: 1024, height: 1024 });

const expoBinary = new URL('../node_modules/.bin/expo', import.meta.url);
if (existsSync(expoBinary)) {
  const introspected = JSON.parse(execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['expo', 'config', '--type', 'introspect', '--json'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }));
  const generatedPermissions = introspected._internal?.modResults?.android?.manifest?.manifest?.['uses-permission'] || [];
  const recordAudio = generatedPermissions.find((entry) => entry?.$?.['android:name'] === 'android.permission.RECORD_AUDIO');
  assert.equal(recordAudio?.$?.['tools:node'], 'remove', 'O manifest Android gerado deve remover RECORD_AUDIO');
  assert.equal(introspected._internal?.modResults?.ios?.infoPlist?.NSMicrophoneUsageDescription ?? null, null);
} else {
  console.warn('Expo introspect não executado: dependências ainda não instaladas neste ambiente.');
}

const firebaseService = await readFile(new URL('../src/services/firebase.ts', import.meta.url), 'utf8');
const authContext = await readFile(new URL('../src/state/auth-context.tsx', import.meta.url), 'utf8');
const profileScreen = await readFile(new URL('../src/app/(tabs)/perfil.tsx', import.meta.url), 'utf8');
assert.ok(firebaseService.includes("status: 'deletion_requested'"));
assert.ok(authContext.includes("'deletion_requested'"));
assert.ok(profileScreen.includes('Excluir minha conta'));

console.log('App Store readiness: configuração, permissões, versões e ícone aprovados.');
