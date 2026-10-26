// npm run dist [-- electron-builder args]: builds the installers, versioned major.minor.<commit count>.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const version = require('./version');

const root = path.join(__dirname, '..');
// installers from older versions would end up in the release too
fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });
// electron-builder's CLI run with node directly: no npx, so no shell on Windows
execFileSync(process.execPath, [require.resolve('electron-builder/cli.js'), ...process.argv.slice(2), `-c.extraMetadata.version=${version(root)}`],
  { cwd: root, stdio: 'inherit' });
