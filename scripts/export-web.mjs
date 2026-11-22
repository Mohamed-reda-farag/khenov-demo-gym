// Builds the static web demo into dist/.
//
// Expo puts font and image files under dist/assets/node_modules/. Some static hosts and upload tools
// skip any folder called node_modules, which would leave the demo without its fonts. This script
// renames the folder to dist/assets/vendor and rewrites the URLs that point to it, then checks
// that every file the bundles refer to is really there.
import { execSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const FROM = 'assets/node_modules/';
const TO = 'assets/vendor/';

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

execSync('npx expo export -p web', { stdio: 'inherit' });

const from = join(DIST, 'assets', 'node_modules');
if (existsSync(from)) renameSync(from, join(DIST, 'assets', 'vendor'));

let rewritten = 0;
for (const file of files(DIST).filter((f) => /\.(js|html)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  if (!text.includes(FROM)) continue;
  writeFileSync(file, text.split(FROM).join(TO));
  rewritten += 1;
}

const missing = [];
for (const file of files(DIST).filter((f) => f.endsWith('.js'))) {
  for (const match of readFileSync(file, 'utf8').matchAll(/\/assets\/vendor\/[^"'\\)\s]+/g)) {
    if (!existsSync(join(DIST, match[0]))) missing.push(match[0]);
  }
}
if (missing.length > 0) {
  console.error(`Missing files referenced by the bundle:\n${[...new Set(missing)].join('\n')}`);
  process.exit(1);
}
console.log(`Web demo ready in ${DIST}/ (${rewritten} files rewritten, no missing assets).`);
