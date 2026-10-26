// Self-check for project/session discovery: node test.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require('./lib');

(async () => {
  const lines = [
    '{"type":"mode","mode":"normal"}',
    '{"type":"user","cwd":"C:\\\\code\\\\app","message":{"content":"<command-name>/init</command-name>"}}',
    '{"type":"user","message":{"content":[{"type":"text","text":"fix the   login bug"}]}}',
  ];
  assert.strictEqual(lib.cwdOf(lines.join('\n')), 'C:\\code\\app');
  assert.strictEqual(lib.titleOf(lines.join('\n')), 'fix the login bug', 'falls back to first real user message');
  assert.strictEqual(lib.titleOf([...lines, '{"type":"ai-title","aiTitle":"Login fix"}'].join('\n')), 'Login fix');
  assert.strictEqual(lib.titleOf(''), 'Untitled session');

  // fake home: one Claude project, one git repo, one graphify project, one pinned folder
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-'));
  const mk = (...p) => { fs.mkdirSync(path.join(home, ...p), { recursive: true }); return path.join(home, ...p); };
  const app = mk('code', 'app');
  const claudeDir = mk('.claude', 'projects', 'enc-app');
  fs.writeFileSync(path.join(claudeDir, 's1.jsonl'), JSON.stringify({ type: 'user', cwd: app, message: { content: 'hello' } }) + '\n');
  mk('code', 'repo', '.git');
  fs.writeFileSync(path.join(home, 'code', 'repo', '.git', 'HEAD'), 'ref: refs/heads/main\n');
  mk('code', 'repo', 'graphify-out');
  fs.writeFileSync(path.join(home, 'code', 'repo', 'graphify-out', 'graph.html'), '<p>g</p>');
  mk('node_modules', 'pkg', '.git'); // must be skipped
  const pinned = mk('notes');

  const ps = await lib.listProjects({ home, claudeDir: path.join(home, '.claude', 'projects'), pins: [pinned, path.join(home, 'gone')] });
  const by = n => ps.find(p => p.name === n);
  assert.strictEqual(ps.length, 3, ps.map(p => p.path).join(', '));
  assert.strictEqual(by('app').sessions, 1);
  assert.ok(by('repo').git && by('repo').hasGraph && by('repo').branch === 'main');
  assert.ok(by('notes').pinned);
  assert.deepStrictEqual((await lib.sessions(claudeDir)).map(s => s.title), ['hello']);

  fs.rmSync(home, { recursive: true, force: true });
  console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
