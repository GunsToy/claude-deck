// Addon sync: Claude Code's plugins, skills, MCP servers, hooks and global CLAUDE.md, copied between
// ~/.claude and a sync repo folder. Plain Node (no Electron) so test.js can exercise it.
//
// Repo layout: settings.json (plugins, marketplaces, plugin options), <platform>.json (hooks and MCP
// servers, which run OS-specific commands), CLAUDE.md, skills/<name>/, deck.json (the main install).
const fs = require('fs');
const path = require('path');

const PLACEHOLDER = '<set on this computer>';
const SECRET = /key|token|secret|pass|auth|cred|cookie|bearer/i;
const SHARED = ['enabledPlugins', 'extraKnownMarketplaces', 'pluginConfigs'];
// Claude Desktop manages skills/synced itself; .git and node_modules are rebuilt where needed
const SKIP_SKILL = new Set(['synced']);
const SKIP_FILE = new Set(['.git', 'node_modules']);

// a missing file is empty, but a broken one must not be overwritten with a fresh {}
const readJson = f => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw new Error(`Can't read ${f}: ${e.message}`);
  }
};
const writeJson = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');
const copyFile = (from, to) => { fs.rmSync(to, { force: true }); if (fs.existsSync(from)) fs.copyFileSync(from, to); };

// paths under home differ between computers, so the repo stores them as tokens (escaped form first: it contains the plain one)
const homeForms = home => [[home.replace(/\\/g, '\\\\'), '{{HOME_ESC}}'], [home, '{{HOME}}'], [home.replace(/\\/g, '/'), '{{HOME_FWD}}']];
const mapStrings = (v, f) => JSON.parse(JSON.stringify(v), (k, x) => (typeof x === 'string' ? f(x) : x));
const tokenize = (v, home) => mapStrings(v, s => homeForms(home).reduce((s, [h, t]) => s.split(h).join(t), s));
const detokenize = (v, home) => mapStrings(v, s => homeForms(home).reduce((s, [h, t]) => s.split(t).join(h), s));

// MCP server config with anything secret-sounding replaced by PLACEHOLDER
function stripSecrets(servers = {}) {
  const out = structuredClone(servers);
  for (const s of Object.values(out)) {
    for (const k of ['env', 'headers']) for (const n in s[k] || {}) if (SECRET.test(n)) s[k][n] = PLACEHOLDER;
    if (s.url) s.url = s.url.replace(/([?&][^=&]*(?:key|token|secret)[^=&]*=)[^&]*/gi, `$1${PLACEHOLDER}`);
    // shortcut: only --secret-flag value / --secret-flag=value args are caught; a token pasted bare into args gets through
    s.args = s.args?.map((a, i, all) => {
      const [flag] = a.split('=');
      if (a.includes('=') && /^--?\w/.test(flag) && SECRET.test(flag)) return `${flag}=${PLACEHOLDER}`;
      return i && /^--?\w/.test(all[i - 1]) && SECRET.test(all[i - 1]) && !a.startsWith('-') ? PLACEHOLDER : a;
    });
  }
  return out;
}

// incoming (stripped) servers over the local ones, keeping this computer's secrets
function mergeServers(incoming = {}, local = {}) {
  const out = { ...local };
  for (const [name, s] of Object.entries(incoming)) {
    const mine = local[name];
    if (mine && JSON.stringify(stripSecrets({ s: mine }).s) === JSON.stringify(s)) continue; // same apart from secrets
    out[name] = structuredClone(s);
    for (const k of ['env', 'headers']) for (const n in s[k] || {}) if (s[k][n] === PLACEHOLDER && mine?.[k]?.[n] != null) out[name][k][n] = mine[k][n];
  }
  return out;
}

const skillNames = dir => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [])
  .filter(e => (e.isDirectory() || e.isSymbolicLink()) && !SKIP_SKILL.has(e.name)).map(e => e.name);
const copySkill = (from, to) => {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true, dereference: true, filter: f => !SKIP_FILE.has(path.basename(f)) });
};

// this computer's addons -> repo folder (the repo mirrors this computer, apart from other platforms' files)
function exportAddons(repo, { home, platform }) {
  const claude = path.join(home, '.claude');
  const settings = readJson(path.join(claude, 'settings.json'));
  writeJson(path.join(repo, 'settings.json'), tokenize(Object.fromEntries(SHARED.map(k => [k, settings[k] || {}])), home));
  writeJson(path.join(repo, `${platform}.json`), tokenize({
    hooks: settings.hooks || {}, mcpServers: stripSecrets(readJson(path.join(home, '.claude.json')).mcpServers),
  }, home));
  copyFile(path.join(claude, 'CLAUDE.md'), path.join(repo, 'CLAUDE.md'));
  fs.rmSync(path.join(repo, 'skills'), { recursive: true, force: true });
  const skills = skillNames(path.join(claude, 'skills'));
  for (const n of skills) copySkill(path.join(claude, 'skills', n), path.join(repo, 'skills', n));
  return { skills: skills.length };
}

// repo folder -> this computer. Plugins merge in; CLAUDE.md, hooks and same-named skills are replaced,
// after copying the files it changes into backup/. Hooks and MCP servers only come from an install on the same OS.
function importAddons(repo, { home, platform, backup }) {
  const claude = path.join(home, '.claude');
  const settingsFile = path.join(claude, 'settings.json'), claudeJson = path.join(home, '.claude.json');
  const settings = readJson(settingsFile);
  const local = readJson(claudeJson);
  fs.mkdirSync(backup, { recursive: true });
  for (const f of [settingsFile, claudeJson, path.join(claude, 'CLAUDE.md')]) copyFile(f, path.join(backup, path.basename(f)));

  const shared = detokenize(readJson(path.join(repo, 'settings.json')), home);
  for (const k of SHARED) settings[k] = { ...settings[k], ...shared[k] };
  const own = fs.existsSync(path.join(repo, `${platform}.json`)) ? detokenize(readJson(path.join(repo, `${platform}.json`)), home) : null;
  let needSecrets = [];
  if (own) {
    settings.hooks = own.hooks;
    local.mcpServers = mergeServers(own.mcpServers, local.mcpServers);
    needSecrets = Object.keys(own.mcpServers || {}).filter(n => JSON.stringify(local.mcpServers[n]).includes(PLACEHOLDER));
    writeJson(claudeJson, local);
  }
  fs.mkdirSync(claude, { recursive: true });
  writeJson(settingsFile, settings);
  if (fs.existsSync(path.join(repo, 'CLAUDE.md'))) fs.copyFileSync(path.join(repo, 'CLAUDE.md'), path.join(claude, 'CLAUDE.md'));
  const skills = skillNames(path.join(repo, 'skills'));
  for (const n of skills) copySkill(path.join(repo, 'skills', n), path.join(claude, 'skills', n));
  return { skills: skills.length, plugins: Object.keys(shared.enabledPlugins || {}).length, sameOs: !!own, needSecrets };
}

module.exports = { PLACEHOLDER, stripSecrets, mergeServers, exportAddons, importAddons, readJson, writeJson };
