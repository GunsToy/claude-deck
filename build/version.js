// Version = major.minor from package.json + commit count as the patch, so every push to GitHub gets a new number.
const { execFileSync } = require('child_process');

module.exports = (dir, ref = 'HEAD') => {
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim();
  const [major, minor] = JSON.parse(git('show', `${ref}:package.json`)).version.split('.');
  return `${major}.${minor}.${git('rev-list', '--count', ref)}`;
};
