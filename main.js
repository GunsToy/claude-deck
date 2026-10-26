const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const pty = require('@lydell/node-pty');
const lib = require('./lib');

const IS_WIN = process.platform === 'win32';
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
ipcMain.handle('pin:remove', (e, dir) => writePins(readPins().filter(p => p !== dir)));

const terms = new Map();
let nextId = 1;
ipcMain.handle('pty:spawn', (e, { cwd, kind, args = [], cols = 100, rows = 30 }) => {
  if (!isDir(cwd)) throw new Error(`Folder not found: ${cwd}`);
  let file, argv;
  if (kind === 'shell') {
    [file, argv] = IS_WIN ? ['powershell.exe', ['-NoLogo']] : [process.env.SHELL || '/bin/bash', []];
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
