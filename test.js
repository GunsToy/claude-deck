// Self-check for project/session discovery: node test.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require('./lib');
const addons = require('./addons');

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
  fs.writeFileSync(path.join(home, 'code', 'repo', '.git', 'config'), '[core]\n\tbare = false\n[remote "origin"]\n\turl = git@github.com:Me/Site.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n');
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
  assert.strictEqual(by('repo').remote, 'me/site', 'ssh remote, folder named differently');
  const gh = ['Me/Site', 'Me/Notes', 'Me/New-Thing'].map(n => ({ nameWithOwner: n, name: n.split('/')[1] }));
  assert.deepStrictEqual(lib.missingRepos(gh, ps).map(r => r.name), ['New-Thing'], 'matched by remote, then by folder name');
  assert.deepStrictEqual((await lib.sessions(claudeDir)).map(s => s.title), ['hello']);

  fs.rmSync(home, { recursive: true, force: true });

  // addon sync: computer A pushes to a repo folder, computer B (different home, own secret) pulls
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-addons-'));
  const [a, b, repo] = ['a', 'b', 'repo'].map(n => { fs.mkdirSync(path.join(tmp, n, '.claude', 'skills'), { recursive: true }); return path.join(tmp, n); });
  const hook = home => ({ Stop: [{ hooks: [{ type: 'command', command: `"${path.join(home, '.claude', 'x').replace(/\\/g, '\\\\')}" hook` }] }] });
  const server = (home, key) => ({ command: path.join(home, 'bin', 'srv'), args: ['--api-key', key, '--port=1'], env: { API_TOKEN: key, MODE: 'fast' } });
  addons.writeJson(path.join(a, '.claude', 'settings.json'), { enabledPlugins: { 'p@m': true }, hooks: hook(a), theme: 'dark' });
  addons.writeJson(path.join(a, '.claude.json'), { userID: 'a', mcpServers: { srv: server(a, 'SECRET-A') } });
  fs.writeFileSync(path.join(a, '.claude', 'CLAUDE.md'), '# rules');
  fs.mkdirSync(path.join(a, '.claude', 'skills', 'tool', 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(a, '.claude', 'skills', 'tool', 'SKILL.md'), 'skill');
  fs.mkdirSync(path.join(a, '.claude', 'skills', 'synced'));
  addons.writeJson(path.join(b, '.claude', 'settings.json'), { enabledPlugins: { 'mine@m': true }, theme: 'light' });
  addons.writeJson(path.join(b, '.claude.json'), { userID: 'b', mcpServers: { srv: server(b, 'SECRET-B'), local: { command: 'x' } } });

  assert.deepStrictEqual(addons.exportAddons(repo, { home: a, platform: 'test' }), { skills: 1 }, 'synced/ is Desktop\'s');
  const pushed = fs.readFileSync(path.join(repo, 'test.json'), 'utf8');
  assert.ok(!pushed.includes('SECRET-A') && !pushed.includes(a.replace(/\\/g, '\\\\')), 'no secrets or home paths in the repo');
  assert.ok(!fs.existsSync(path.join(repo, 'skills', 'tool', 'node_modules')));

  const r = addons.importAddons(repo, { home: b, platform: 'test', backup: path.join(tmp, 'backup') });
  assert.deepStrictEqual(r, { skills: 1, plugins: 1, sameOs: true, needSecrets: [] });
  const sb = addons.readJson(path.join(b, '.claude', 'settings.json')), cb = addons.readJson(path.join(b, '.claude.json'));
  assert.deepStrictEqual(sb.enabledPlugins, { 'mine@m': true, 'p@m': true }, 'plugins merge');
  assert.strictEqual(sb.theme, 'light', 'unsynced settings untouched');
  assert.deepStrictEqual(sb.hooks, hook(b), 'hook paths point at this home');
  assert.deepStrictEqual(cb.mcpServers, { srv: server(b, 'SECRET-B'), local: { command: 'x' } }, 'own secret and local-only servers kept');
  assert.strictEqual(cb.userID, 'b');
  assert.strictEqual(fs.readFileSync(path.join(b, '.claude', 'CLAUDE.md'), 'utf8'), '# rules');
  assert.strictEqual(addons.readJson(path.join(tmp, 'backup', 'settings.json')).theme, 'light', 'backed up first');

  // a computer that never had the server gets placeholders, and a different OS gets no hooks or MCP servers
  fs.rmSync(path.join(b, '.claude.json'));
  assert.deepStrictEqual(addons.importAddons(repo, { home: b, platform: 'test', backup: path.join(tmp, 'backup') }).needSecrets, ['srv']);
  assert.strictEqual(addons.readJson(path.join(b, '.claude.json')).mcpServers.srv.env.API_TOKEN, addons.PLACEHOLDER);
  assert.strictEqual(addons.importAddons(repo, { home: b, platform: 'other', backup: path.join(tmp, 'backup') }).sameOs, false);
  fs.writeFileSync(path.join(b, '.claude.json'), '{broken');
  assert.throws(() => addons.importAddons(repo, { home: b, platform: 'test', backup: path.join(tmp, 'backup') }), /Can't read/, 'never overwrite a broken file');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
