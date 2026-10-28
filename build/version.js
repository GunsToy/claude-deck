// Version = major.minor from package.json + commits since the version line last changed, so a bump starts at .0 and every push gets a new number.
const { execFileSync } = require('child_process');

module.exports = (dir, ref = 'HEAD') => {
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim();
  const [major, minor] = JSON.parse(git('show', `${ref}:package.json`)).version.split('.');
  const bump = git('log', '-1', '--format=%H', '-G^\s*"version"', ref, '--', 'package.json');
  return `${major}.${minor}.${git('rev-list', '--count', `${bump}..${ref}`)}`;
};
