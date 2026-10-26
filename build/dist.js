// npm run dist [-- electron-builder args]: stamps the commit and version, then builds the installers.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const version = require('./version');

const root = path.join(__dirname, '..');
fs.writeFileSync(path.join(__dirname, 'commit.txt'), execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim());
// installers from older versions would leave the updater more than one to pick from
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
execFileSync('npx', ['electron-builder', ...process.argv.slice(2), `-c.extraMetadata.version=${version(root)}`],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
