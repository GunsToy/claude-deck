// Project + session discovery. Plain Node (no Electron) so test.js can exercise it.
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

const IS_WIN = process.platform === 'win32';
const key = p => (IS_WIN ? p.toLowerCase() : p);
const exists = p => { try { fs.accessSync(p); return true; } catch { return false; } };
const SKIP = new Set(['node_modules', 'AppData', 'Application Data', 'Library', 'snap', 'venv', '__pycache__', '$Recycle.Bin']);

function findClaude(home = os.homedir()) {
  const names = IS_WIN ? ['claude.exe', 'claude.cmd'] : ['claude'];
  // desktop launchers on Linux often lack ~/.local/bin in PATH, so check the install dirs first
  const dirs = [path.join(home, '.local', 'bin'), path.join(home, '.claude', 'local'), ...(process.env.PATH || '').split(path.delimiter)];
  for (const d of dirs) for (const n of names) { const f = path.join(d, n); if (d && exists(f)) return f; }
  return null;
}

async function readHead(file, bytes = 65536) {
  const fh = await fsp.open(file, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await fh.read(buf, 0, bytes, 0);
    return buf.toString('utf8', 0, bytesRead);
  } finally { await fh.close(); }
}

function cwdOf(text) {
  const m = text.match(/"cwd":"((?:[^"\\]|\\.)*)"/);
  return m ? JSON.parse(`"${m[1]}"`) : null;
}

// Prefer Claude's generated title, then a summary, then the first thing the user typed.
function titleOf(text) {
  let ai = null, summary = null, first = null;
  for (const line of text.split('\n')) {
    if (line.includes('"aiTitle"')) { try { ai = JSON.parse(line).aiTitle; } catch {} }
    else if (line.includes('"type":"summary"')) { try { summary = JSON.parse(line).summary; } catch {} }
    else if (!first && line.includes('"type":"user"')) {
      try {
        const c = JSON.parse(line).message?.content;
        const t = typeof c === 'string' ? c : Array.isArray(c) ? c.find(x => x.type === 'text')?.text : null;
        if (t && !t.trimStart().startsWith('<')) first = t.trim();
      } catch {}
    }
  }
  return (ai || summary || first || 'Untitled session').replace(/\s+/g, ' ').slice(0, 120);
}

async function jsonlFiles(dir) {
  const names = (await fsp.readdir(dir).catch(() => [])).filter(n => n.endsWith('.jsonl'));
  const out = [];
  for (const n of names) {
    const st = await fsp.stat(path.join(dir, n)).catch(() => null);
    if (st && st.size) out.push({ id: n.slice(0, -6), file: path.join(dir, n), mtime: st.mtimeMs });
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

const titleCache = new Map();
async function sessionTitle(s) {
  const c = titleCache.get(s.file);
  if (c && c.mtime === s.mtime) return c.title;
  const title = titleOf(await fsp.readFile(s.file, 'utf8').catch(() => ''));
  titleCache.set(s.file, { mtime: s.mtime, title });
  return title;
}

function gitBranch(dir) {
  try {
    const head = fs.readFileSync(path.join(dir, '.git', 'HEAD'), 'utf8').trim();
    return head.startsWith('ref: refs/heads/') ? head.slice(16) : head.slice(0, 7);
  } catch { return null; }
}

// "owner/name" of a GitHub origin (https or ssh URL), lowercased for matching
function gitRemote(dir) {
  try {
    const url = fs.readFileSync(path.join(dir, '.git', 'config'), 'utf8').match(/\[remote "origin"\][^[]*?url\s*=\s*(\S+)/)?.[1];
    return url?.match(/github\.com[:/](.+?)(?:\.git)?\/?$/i)?.[1].toLowerCase() || null;
  } catch { return null; }
}

// GitHub repos with no local copy: matched by origin URL, or by a folder already using the repo's name
function missingRepos(repos, projects) {
  const remotes = new Set(projects.map(p => p.remote).filter(Boolean));
  const names = new Set(projects.map(p => p.name.toLowerCase()));
  return repos.filter(r => !remotes.has(r.nameWithOwner.toLowerCase()) && !names.has(r.name.toLowerCase()));
}

// Merges three sources: folders Claude Code has run in, git repos / graphify outputs near home, and pinned folders.
async function listProjects({ home = os.homedir(), claudeDir = path.join(home, '.claude', 'projects'), pins = [], depth = 3 } = {}) {
  const map = new Map();
  // Claude's own scratch workspaces live under AppData; they are not user projects
  const hidden = key(path.join(home, 'AppData') + path.sep);
  const add = (dir, patch) => {
    if (!dir || !exists(dir) || key(dir + path.sep).startsWith(hidden)) return;
    const k = key(path.resolve(dir));
    const p = map.get(k) || { path: path.resolve(dir), name: k === key(path.resolve(home)) ? 'Home' : path.basename(dir) || dir, sessions: 0, lastActive: 0, claudeDir: null, git: false, pinned: false };
    map.set(k, Object.assign(p, patch, { lastActive: Math.max(p.lastActive, patch.lastActive || 0) }));
  };

  for (const d of await fsp.readdir(claudeDir).catch(() => [])) {
    const dir = path.join(claudeDir, d);
    const files = await jsonlFiles(dir);
    if (!files.length) continue;
    let cwd = null;
    for (const f of files) if ((cwd = cwdOf(await readHead(f.file).catch(() => '')))) break;
    add(cwd, { claudeDir: dir, sessions: files.length, lastActive: files[0].mtime });
  }

  const walk = (dir, lvl) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    const names = new Set(entries.map(e => e.name));
    if (names.has('.git')) add(dir, { git: true, lastActive: statTime(dir) });
    if (names.has('graphify-out')) add(dir, { lastActive: statTime(dir) });
    if (lvl >= depth) return;
    for (const e of entries) if (e.isDirectory() && !e.name.startsWith('.') && !SKIP.has(e.name)) walk(path.join(dir, e.name), lvl + 1);
  };
  walk(home, 0);

  for (const p of pins) add(p, { pinned: true });

  return [...map.values()].map(p => ({
    ...p,
    branch: gitBranch(p.path),
    remote: gitRemote(p.path),
    hasGraph: exists(path.join(p.path, 'graphify-out', 'graph.html')),
    hasReport: exists(path.join(p.path, 'graphify-out', 'GRAPH_REPORT.md')),
  })).sort((a, b) => b.lastActive - a.lastActive);
}

function statTime(dir) { try { return fs.statSync(dir).mtimeMs; } catch { return 0; } }

async function sessions(claudeDir) {
  const files = await jsonlFiles(claudeDir);
  return Promise.all(files.map(async s => ({ id: s.id, mtime: s.mtime, title: await sessionTitle(s) })));
}

async function recentSessions(claudeDir, limit = 6) {
  const all = [];
  for (const d of await fsp.readdir(claudeDir).catch(() => [])) all.push(...await jsonlFiles(path.join(claudeDir, d)));
  all.sort((a, b) => b.mtime - a.mtime);
  return Promise.all(all.slice(0, limit).map(async s => ({
    id: s.id, mtime: s.mtime, title: await sessionTitle(s), cwd: cwdOf(await readHead(s.file).catch(() => '')),
  })));
}

module.exports = { findClaude, listProjects, sessions, recentSessions, titleOf, cwdOf, missingRepos };
