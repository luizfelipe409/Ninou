import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const patches = [
  {
    file: path.join(projectRoot, 'node_modules/expo-constants/ios/EXConstants.podspec'),
    before:
      ':script => "bash -l -c \\"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
    after:
      ':script => "bash \\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
  },
  {
    file: path.join(
      projectRoot,
      'node_modules/expo-constants/scripts/get-app-config-ios.sh'
    ),
    before: 'PROJECT_DIR_BASENAME=$(basename $PROJECT_DIR)',
    after: 'PROJECT_DIR_BASENAME=$(basename "$PROJECT_DIR")',
  },
  {
    file: path.join(projectRoot, 'ios/Ninou.xcodeproj/project.pbxproj'),
    optional: true,
    before:
      '`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`',
    after:
      'REACT_NATIVE_XCODE_SCRIPT=\\"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")\\"\\n\\"$REACT_NATIVE_XCODE_SCRIPT\\"',
  },
];

for (const patch of patches) {
  if (patch.optional) {
    try {
      await access(patch.file);
    } catch {
      continue;
    }
  }

  const source = await readFile(patch.file, 'utf8');

  if (source.includes(patch.after)) {
    continue;
  }

  if (!source.includes(patch.before)) {
    throw new Error(`Expected Expo source was not found in ${patch.file}`);
  }

  await writeFile(patch.file, source.replace(patch.before, patch.after));
}

console.log('Applied Expo iOS path compatibility patch.');
