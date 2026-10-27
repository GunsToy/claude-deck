const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { execFile, execFileSync } = require('child_process');
const { autoUpdater } = require('electron-updater');
const pty = require('@lydell/node-pty');
const crypto = require('crypto');
const lib = require('./lib');
const addons = require('./addons');
const version = require('./build/version');

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
const ignoredFile = () => path.join(app.getPath('userData'), 'github-ignored.json');
const readIgnored = () => { try { return JSON.parse(fs.readFileSync(ignoredFile(), 'utf8')); } catch { return []; } };

// packaged builds carry the version build/dist.js gave them; a dev run works it out from git
ipcMain.handle('version', () => { try { return app.isPackaged ? app.getVersion() : `${version(__dirname)}-dev`; } catch { return app.getVersion(); } });

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

// GIT_TERMINAL_PROMPT=0: no terminal to answer a credential prompt, so fail instead of hanging
const sh = (cmd, args, { cwd, timeout = 0 }, onOut) => new Promise((res, rej) => {
  const p = execFile(cmd, args, { cwd, timeout, maxBuffer: 64 << 20, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
    (err, out, errOut) => {
      if (!err) return res(out.trim());
      // git ends with a bare "Aborting"; its error:/fatal: line is the one that explains
      const lines = String(errOut || err.message).trim().split('\n');
      rej(new Error((lines.find(l => /^(error|fatal): /.test(l)) || lines.pop()).replace(/^(error|fatal): /, '')));
    });
  if (onOut) { p.stdout.on('data', onOut); p.stderr.on('data', onOut); }
});
// Updates come from this repo's public GitHub Releases (published by `npm run release`),
// as configured by build.publish in package.json
let updateInfo = null;
async function updater() {
  autoUpdater.autoDownload = false;
  autoUpdater.disableWebInstaller = true;
  return autoUpdater;
}
ipcMain.handle('update:check', async () => {
  if (!app.isPackaged) throw new Error('This copy runs from source: update it with git pull.');
  const r = await (await updater()).checkForUpdates();
  updateInfo = r?.isUpdateAvailable ? r.updateInfo : null;
  return { available: !!updateInfo, version: updateInfo?.version };
});
ipcMain.handle('update:install', async e => {
  if (!updateInfo) throw new Error('Check for updates first.');
  const u = await updater();
  const progress = p => e.sender.send('update:step', 'Downloading…', Math.round(p.percent));
  u.on('download-progress', progress);
  e.sender.send('update:step', 'Downloading…', 0);
  try { await u.downloadUpdate(); } finally { u.off('download-progress', progress); }
  e.sender.send('update:step', 'Installing…', 100);
  // silent install, then start the new version
  setImmediate(() => u.quitAndInstall(true, true));
});

// Your GitHub repos (via the signed-in gh CLI) that aren't on this computer yet
let offered = new Set();
ipcMain.handle('github:new', async () => {
  let repos;
  try {
    repos = JSON.parse(await sh('gh', ['repo', 'list', '--no-archived', '--limit', '200', '--json', 'nameWithOwner,name,description'], { cwd: os.homedir(), timeout: 30000 }));
  } catch { return []; } // gh missing or signed out: nothing to offer
  const ignored = new Set(readIgnored());
  const missing = lib.missingRepos(repos, await lib.listProjects({ pins: readPins() })).filter(r => !ignored.has(r.nameWithOwner));
  offered = new Set(missing.map(r => r.nameWithOwner));
  return missing;
});
ipcMain.handle('github:clone', async (e, nameWithOwner) => {
  if (!offered.has(nameWithOwner)) throw new Error(`${nameWithOwner} wasn't offered for cloning.`);
  const dest = path.join(os.homedir(), nameWithOwner.split('/')[1]);
  if (fs.existsSync(dest)) throw new Error(`${dest} already exists.`);
  await sh('gh', ['repo', 'clone', nameWithOwner, dest], { cwd: os.homedir() });
  return dest;
});
// Local GitHub clones whose branch is behind its upstream
let offeredPull = new Set();
ipcMain.handle('github:behind', async () => {
  const ignored = new Set(readIgnored());
  const repos = (await lib.listProjects({ pins: readPins() })).filter(p => p.remote && !ignored.has(p.path));
  const behind = (await Promise.all(repos.map(async p => {
    try {
      await sh('git', ['fetch', '--quiet'], { cwd: p.path, timeout: 30000 });
      const n = Number(await sh('git', ['rev-list', '--count', 'HEAD..@{u}'], { cwd: p.path }));
      return n ? { path: p.path, name: p.name, branch: p.branch, behind: n } : null;
    } catch { return null; } // no upstream, offline, or no access
  }))).filter(Boolean);
  offeredPull = new Set(behind.map(r => r.path));
  return behind;
});
ipcMain.handle('github:pull', async (e, dir) => {
  if (!offeredPull.has(dir)) throw new Error(`${dir} wasn't offered for pulling.`);
  await sh('git', ['pull', '--ff-only'], { cwd: dir, timeout: 120000 });
});
// keys are "owner/name" for new repos and folder paths for ones that are behind
ipcMain.handle('github:ignore', (e, keys) =>
  fs.writeFileSync(ignoredFile(), JSON.stringify([...new Set([...readIgnored(), ...keys.filter(k => offered.has(k) || offeredPull.has(k))])], null, 2)));

// Addon sync through a private <you>/claude-deck-sync repo. Only the main install, once one is set, can push.
const syncDir = () => path.join(app.getPath('userData'), 'addon-sync');
const installId = () => {
  const f = path.join(app.getPath('userData'), 'install-id');
  try { return fs.readFileSync(f, 'utf8'); } catch { const id = crypto.randomUUID(); fs.writeFileSync(f, id); return id; }
};
const addonOpts = () => ({ home: os.homedir(), platform: process.platform, backup: path.join(app.getPath('userData'), 'addon-backup') });
// gh as the credential helper for this repo only, so pushing needs no `gh auth setup-git`
const git = args => sh('git', ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential',
  '-c', 'user.name=Claude Deck', '-c', 'user.email=claude-deck@users.noreply.github.com', ...args], { cwd: syncDir(), timeout: 120000 });
let syncing = false;
// Clones the sync repo (creating it on GitHub only when `create`) and checks out GitHub's latest: the local clone is only a workspace
async function syncRepo(fn, create = false) {
  if (syncing) throw new Error('Addon sync is already running.');
  syncing = true;
  try {
    let login;
    try { login = await sh('gh', ['api', 'user', '--jq', '.login'], { cwd: os.homedir(), timeout: 30000 }); }
    catch { throw new Error('Sign in to GitHub first: run gh auth login in a shell.'); }
    const repo = `${login}/claude-deck-sync`;
    if (!isDir(path.join(syncDir(), '.git'))) {
      fs.rmSync(syncDir(), { recursive: true, force: true });
      try { await sh('gh', ['repo', 'view', repo, '--json', 'name'], { cwd: os.homedir(), timeout: 30000 }); }
      catch {
        if (!create) return await fn({ login, deck: {}, isMain: false });
        await sh('gh', ['repo', 'create', repo, '--private', '--description', 'Claude Code addons synced by Claude Deck'], { cwd: os.homedir(), timeout: 30000 });
      }
      await sh('gh', ['repo', 'clone', repo, syncDir()], { cwd: os.homedir(), timeout: 120000 });
    }
    await git(['fetch', 'origin']);
    if (await git(['ls-remote', '--heads', 'origin', 'main'])) await git(['checkout', '-f', '-B', 'main', 'origin/main']);
    else await git(['symbolic-ref', 'HEAD', 'refs/heads/main']); // new, empty repo
    await git(['clean', '-fdx']);
    const deck = addons.readJson(path.join(syncDir(), 'deck.json'));
    return await fn({ login, deck, isMain: deck.main?.id === installId() });
  } finally { syncing = false; }
}
async function commitPush(message) {
  await git(['add', '-A']);
  if (!(await git(['status', '--porcelain']))) return false;
  await git(['commit', '-m', message]);
  await git(['push', 'origin', 'main']);
  return true;
}
ipcMain.handle('addons:status', () => syncRepo(async ({ login, deck, isMain }) => ({ login, main: deck.main || null, isMain })));
ipcMain.handle('addons:push', () => syncRepo(async ({ deck, isMain }) => {
  if (deck.main && !isMain) throw new Error(`Only the main install (${deck.main.name}) can push. Make this the main install first.`);
  const r = addons.exportAddons(syncDir(), addonOpts());
  return { ...r, changed: await commitPush(`Addons from ${os.hostname()}`) };
}, true));
ipcMain.handle('addons:pull', () => syncRepo(async ({ deck }) => {
  if (!fs.existsSync(path.join(syncDir(), 'settings.json'))) throw new Error('Nothing to pull yet. Push from your main install first.');
  return { ...addons.importAddons(syncDir(), addonOpts()), from: deck.main?.name || null, backup: addonOpts().backup };
}));
ipcMain.handle('addons:main', () => syncRepo(async ({ deck }) => {
  addons.writeJson(path.join(syncDir(), 'deck.json'), { ...deck, main: { id: installId(), name: os.hostname(), platform: process.platform } });
  await commitPush(`Make ${os.hostname()} the main install`);
}, true));

const terms = new Map();
let nextId = 1;

// HTML pages and images a session creates or changes, for the preview pane. Dot folders and dependency dirs are noise.
const NOISE = /(^|[\\/])(\.[^\\/]*|node_modules|__pycache__|venv|AppData)([\\/]|$)/;
const PREVIEWABLE = /\.(html?|png|jpe?g|gif|webp|svg)$/i;
const watchers = new Map();
const previewable = new Set();
function watchCwd(id, cwd, wc) {
  try {
    // shortcut: recursive fs.watch walks the whole tree on Linux; fine for project folders, slow for a session started in ~
    const w = fs.watch(cwd, { recursive: true }, (ev, name) => {
      if (!name || !PREVIEWABLE.test(name) || NOISE.test(name)) return;
      const file = path.join(cwd, name);
      fs.stat(file, (err, st) => {
        if (err || !st.isFile() || wc.isDestroyed()) return;
        previewable.add(file);
        wc.send('preview:file', file, cwd);
      });
    });
    w.on('error', () => unwatch(id));
    watchers.set(id, w);
  } catch { /* no preview for this folder */ }
}
const unwatch = id => { watchers.get(id)?.close(); watchers.delete(id); };
// only paths a session watcher reported, so the page can't read arbitrary files
ipcMain.handle('preview:read', async (e, file) => {
  if (!previewable.has(file)) return null;
  const st = await fs.promises.stat(file).catch(() => null);
  return st?.isFile() ? pathToFileURL(file).href : null;
});
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
  if (kind !== 'rea-setup') watchCwd(id, cwd, wc);
  p.onData(d => { if (!wc.isDestroyed()) wc.send('pty:data', id, d); });
  p.onExit(({ exitCode }) => { terms.delete(id); unwatch(id); if (!wc.isDestroyed()) wc.send('pty:exit', id, exitCode); });
  return id;
});
ipcMain.on('pty:write', (e, id, d) => terms.get(id)?.write(d));
ipcMain.on('pty:resize', (e, id, c, r) => { try { terms.get(id)?.resize(c, r); } catch { /* pty already gone */ } });
ipcMain.on('pty:kill', (e, id) => { terms.get(id)?.kill(); terms.delete(id); unwatch(id); });

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
