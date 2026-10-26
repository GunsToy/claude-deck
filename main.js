const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { execFile, execFileSync } = require('child_process');
const pty = require('@lydell/node-pty');
const lib = require('./lib');

const IS_WIN = process.platform === 'win32';
// launched from a desktop menu, PATH lacks what ~/.bashrc adds (brew, nvm), so claude's MCP servers and npx go missing.
// Markers because interactive shells may print a banner.
if (!IS_WIN) {
  try {
    const out = execFileSync(process.env.SHELL || '/bin/bash', ['-ilc', 'printf "__DECK_PATH__%s__DECK_PATH__" "$PATH"'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = out.match(/__DECK_PATH__(.*)__DECK_PATH__/);
    if (m?.[1]) process.env.PATH = m[1];
  } catch { /* keep the inherited PATH */ }
}
const CLAUDE_PROJECTS = path.join(os.homedir(), '.claude', 'projects');
const pinsFile = () => path.join(app.getPath('userData'), 'pins.json');
const readPins = () => { try { return JSON.parse(fs.readFileSync(pinsFile(), 'utf8')); } catch { return []; } };
const writePins = pins => fs.writeFileSync(pinsFile(), JSON.stringify(pins, null, 2));
const isDir = p => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

ipcMain.handle('projects', async () => (await lib.listProjects({ pins: readPins() })).map(p => ({
  ...p, graphUrl: p.hasGraph ? pathToFileURL(path.join(p.path, 'graphify-out', 'graph.html')).href : null,
})));
ipcMain.handle('sessions', (e, claudeDir) => path.dirname(claudeDir) === CLAUDE_PROJECTS ? lib.sessions(claudeDir) : []);
ipcMain.handle('recent', () => lib.recentSessions(CLAUDE_PROJECTS));
ipcMain.handle('report', (e, dir) => fs.promises.readFile(path.join(dir, 'graphify-out', 'GRAPH_REPORT.md'), 'utf8').catch(() => null));
ipcMain.handle('open-folder', (e, dir) => isDir(dir) && shell.openPath(dir));
ipcMain.handle('clip:read', () => clipboard.readText());
ipcMain.handle('clip:write', (e, t) => clipboard.writeText(String(t)));
ipcMain.handle('pin:pick', async e => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  writePins([...new Set([...readPins(), r.filePaths[0]])]);
  return r.filePaths[0];
});
ipcMain.handle('pick-target', async e => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { title: 'Pick an app or binary to reverse engineer', properties: ['openFile'] });
  return r.canceled ? null : r.filePaths[0] || null;
});
ipcMain.handle('pin:remove', (e, dir) => writePins(readPins().filter(p => p !== dir)));

// The same numbers Claude Code's /usage shows, read with Claude Code's own login.
ipcMain.handle('usage', async () => {
  let o;
  try { o = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude', '.credentials.json'), 'utf8')).claudeAiOauth; } catch { /* not signed in */ }
  if (!o?.accessToken) return { error: 'Sign in to Claude Code to see usage.' };
  // refreshing here would rotate Claude Code's refresh token under it, so leave that to Claude Code
  if (o.expiresAt < Date.now()) return { error: 'Login expired. Start a Claude session to renew it.' };
  try {
    const r = await fetch('https://api.anthropic.com/api/oauth/usage', {
      headers: { Authorization: `Bearer ${o.accessToken}`, 'anthropic-beta': 'oauth-2025-04-20' }, signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    return { session: d.five_hour, week: d.seven_day };
  } catch { return { error: 'Usage is unavailable right now.' }; }
});

// Updates rebuild from the local clone. shortcut: assumes it lives in ~/claude-deck; make it a setting if that changes
const SOURCE = path.join(os.homedir(), 'claude-deck');
const run = (cmd, args, onOut) => new Promise((res, rej) => {
  const p = execFile(cmd, args, { cwd: SOURCE, shell: IS_WIN, maxBuffer: 64 << 20 },
    (err, out, errOut) => (err ? rej(new Error(String(errOut || err.message).trim().split('\n').pop())) : res(out.trim())));
  if (onOut) { p.stdout.on('data', onOut); p.stderr.on('data', onOut); }
});
// electron-builder's log lines, mapped to how far through the update they come
const BUILD_STAGES = [[/@electron\/rebuild/, 30], [/packaging/, 45], [/building\s+target=/, 65]];
// a packaged build stamps its commit at build time (predist); a dev run is whatever is checked out
const builtFrom = () => (app.isPackaged ? fs.readFileSync(path.join(__dirname, 'build', 'commit.txt'), 'utf8').trim() : run('git', ['rev-parse', 'HEAD']));
ipcMain.handle('update:check', async () => {
  if (!isDir(path.join(SOURCE, '.git'))) throw new Error(`No Claude Deck source folder at ${SOURCE}`);
  await run('git', ['fetch', '--quiet']);
  return Number(await run('git', ['rev-list', '--count', `${await builtFrom()}..@{u}`]));
});
ipcMain.handle('update:install', async e => {
  const step = (s, pct) => e.sender.send('update:step', s, pct);
  step('Pulling…', 3); await run('git', ['pull', '--ff-only']);
  step('Installing packages…', 10); await run('npm', ['install']);
  if (!app.isPackaged) { app.relaunch(); return app.quit(); }
  step('Building…', 25);
  let pct = 25;
  // only the installer this update needs; the full `npm run dist` also makes a .deb / portable exe
  await run('npm', ['run', 'dist', '--', IS_WIN ? '--win' : '--linux', IS_WIN ? 'nsis' : 'AppImage'], chunk => {
    for (const [re, p] of BUILD_STAGES) if (p > pct && re.test(chunk)) { pct = p; step('Building…', p); }
  });
  const dist = path.join(SOURCE, 'dist');
  const built = fs.readdirSync(dist).find(f => (IS_WIN ? /Setup.*\.exe$/ : /\.AppImage$/).test(f));
  if (!built) throw new Error('The build finished but made no installer.');
  if (IS_WIN) { await shell.openPath(path.join(dist, built)); return app.quit(); }
  const target = process.env.APPIMAGE;
  if (!target) throw new Error(`Built ${built} in ${dist}. Install it by hand: this copy isn't an AppImage.`);
  // copy then rename, so the running AppImage keeps its old file until it exits
  step('Installing…', 95);
  await fs.promises.copyFile(path.join(dist, built), target + '.new');
  await fs.promises.chmod(target + '.new', 0o755);
  await fs.promises.rename(target + '.new', target);
  app.relaunch({ execPath: target, args: [] });
  app.quit();
});

const terms = new Map();
let nextId = 1;
ipcMain.handle('pty:spawn', (e, { cwd, kind, args = [], cols = 100, rows = 30 }) => {
  if (!isDir(cwd)) throw new Error(`Folder not found: ${cwd}`);
  let file, argv;
  if (kind === 'shell') {
    [file, argv] = IS_WIN ? ['powershell.exe', ['-NoLogo']] : [process.env.SHELL || '/bin/bash', []];
  } else if (kind === 'rea-setup') {
    [file, argv] = IS_WIN ? ['cmd.exe', ['/c', 'npx', 'rea-agents', 'setup']] : ['npx', ['rea-agents', 'setup']];
  } else {
    const claude = lib.findClaude();
    if (!claude) throw new Error('Claude Code is not installed or not on PATH.');
    [file, argv] = claude.endsWith('.cmd') ? ['cmd.exe', ['/c', claude, ...args]] : [claude, args];
  }
  const env = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' };
  // if Deck was itself launched from a Claude session, these would make every child session think it's nested
  for (const k of ['CLAUDECODE', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SSE_PORT']) delete env[k];
  const p = pty.spawn(file, argv, { name: 'xterm-256color', cwd, cols, rows, env });
  const id = nextId++;
  const wc = e.sender;
  terms.set(id, p);
  p.onData(d => { if (!wc.isDestroyed()) wc.send('pty:data', id, d); });
  p.onExit(({ exitCode }) => { terms.delete(id); if (!wc.isDestroyed()) wc.send('pty:exit', id, exitCode); });
  return id;
});
ipcMain.on('pty:write', (e, id, d) => terms.get(id)?.write(d));
ipcMain.on('pty:resize', (e, id, c, r) => { try { terms.get(id)?.resize(c, r); } catch { /* pty already gone */ } });
ipcMain.on('pty:kill', (e, id) => { terms.get(id)?.kill(); terms.delete(id); });

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 900, minHeight: 600,
    title: 'Claude Deck', backgroundColor: '#050505', show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0b0b0b', symbolColor: '#9e9e9e', height: 44 },
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('before-quit', () => terms.forEach(t => t.kill()));
app.on('window-all-closed', () => app.quit());
