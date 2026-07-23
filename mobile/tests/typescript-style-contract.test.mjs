import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const allowedWeights = new Set([
  'normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900',
  'ultralight', 'thin', 'light', 'medium', 'regular', 'semibold', 'condensed',
  'condensedBold', 'heavy', 'black',
]);
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (['.ts', '.tsx'].includes(extname(entry.name))) await inspect(path);
  }
}

async function inspect(path) {
  const source = await readFile(path, 'utf8');
  for (const match of source.matchAll(/fontWeight\s*:\s*['"]([^'"]+)['"]/g)) {
    if (!allowedWeights.has(match[1])) failures.push(`${relative(root, path)}: fontWeight ${match[1]} não suportado pelo React Native`);
  }
  for (const match of source.matchAll(/(?:from\s+|import\s*\()(['"])([^'"]+\.tsx?)\1/g)) {
    failures.push(`${relative(root, path)}: import TypeScript com extensão explícita (${match[2]})`);
  }
}


const mobileRoot = fileURLToPath(new URL('../', import.meta.url));
const packageConfig = JSON.parse(await readFile(join(mobileRoot, 'package.json'), 'utf8'));
const eslintCommonJsPath = join(mobileRoot, 'eslint.config.cjs');
const eslintCommonJsConfig = await readFile(eslintCommonJsPath, 'utf8');
if (packageConfig.type === 'module') {
  assert.match(eslintCommonJsConfig, /\brequire\s*\(/, 'eslint.config.cjs deve permanecer em CommonJS');
  assert.match(eslintCommonJsConfig, /\bmodule\.exports\b/, 'eslint.config.cjs deve exportar a configuração em CommonJS');
}

await walk(root);
assert.deepEqual(failures, [], failures.join('\n'));
console.log('TypeScript style/import contracts: OK');
