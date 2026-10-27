const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const same = (a, b) => (deck.platform === 'win32' ? a?.toLowerCase() === b?.toLowerCase() : a === b);
const ago = ms => {
  if (!ms) return '';
  const s = (Date.now() - ms) / 1000;
  for (const [u, d] of [['y', 31536000], ['mo', 2592000], ['w', 604800], ['d', 86400], ['h', 3600], ['m', 60]]) if (s >= d) return `${Math.floor(s / d)}${u} ago`;
  return 'just now';
};
const hue = str => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const avatar = (p, cls = '') => `<span class="avatar ${cls}" style="--h:${hue(p.name)}">${esc((p.name[0] || '?').toUpperCase())}</span>`;
const ICON = {
  branch: '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 8v8M18 10a6 6 0 0 1-6 6H8"/></svg>',
  graph: '<svg viewBox="0 0 24 24"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6 8l5 8.3M18 8l-5 8.3"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M5 18.5V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8z"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  term: '<svg viewBox="0 0 24 24"><path d="m5 8 4 4-4 4M12 16h7"/></svg>',
};

let projects = [];
let recent = [];
let view = { type: 'home' };
let projectTab = 'sessions';
const terms = new Map(); // id -> { term, fit, el, title, cwd, exited }

function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => (t.hidden = true), 4000);
}
const errText = err => String(err.message || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
const projectOf = cwd => projects.find(p => same(p.path, cwd));
const nameOf = cwd => projectOf(cwd)?.name || cwd?.split(/[\\/]/).filter(Boolean).pop() || 'Session';

// ---------- data ----------
async function load() {
  [projects, recent] = await Promise.all([deck.projects(), deck.recent()]);
  renderSidebar(); renderHome();
  if (view.type === 'project' && !projectOf(view.path)) show({ type: 'home' });
}

// ---------- views ----------
function show(v) {
  closeFind();
  view = v;
  $('home').hidden = v.type !== 'home';
  $('project').hidden = v.type !== 'project';
  $('terms').hidden = v.type !== 'term';
  for (const [id, t] of terms) t.el.hidden = !(v.type === 'term' && v.id === id);
  if (v.type === 'project') renderProject();
  if (v.type === 'term') { const t = terms.get(v.id); requestAnimationFrame(() => { t.fit.fit(); t.term.focus(); }); }
  renderTabs(); renderSidebar();
}

function renderTabs() {
  let html = `<button class="tab home ${view.type !== 'term' ? 'active' : ''}" data-home title="Home">${ICON.home}</button>`;
  for (const [id, t] of terms) {
    html += `<div class="tab ${view.type === 'term' && view.id === id ? 'active' : ''} ${t.exited ? 'exited' : ''}" data-term="${id}" title="${esc(t.cwd)}">
      <span class="dot"></span><span class="t">${esc(t.title)}</span>
      <button class="x" data-close="${id}" aria-label="Close tab">${ICON.x}</button></div>`;
  }
  $('tabs').innerHTML = html;
}

function renderSidebar() {
  const q = $('search').value.toLowerCase();
  const running = new Set([...terms.values()].filter(t => !t.exited).map(t => (deck.platform === 'win32' ? t.cwd.toLowerCase() : t.cwd)));
  const list = projects.filter(p => (p.name + ' ' + p.path).toLowerCase().includes(q));
  $('list').innerHTML = list.map(p => `
    <button class="item ${view.type === 'project' && same(view.path, p.path) ? 'active' : ''}" data-project="${esc(p.path)}" title="${esc(p.path)}">
      ${avatar(p)}
      <span class="meta"><b>${esc(p.name)}</b><small>${p.sessions ? `${p.sessions} session${p.sessions > 1 ? 's' : ''}` : p.git ? 'git repo' : 'folder'}${p.lastActive ? ' · ' + ago(p.lastActive) : ''}</small></span>
      ${running.has(deck.platform === 'win32' ? p.path.toLowerCase() : p.path) ? '<span class="live" title="Running"></span>' : ''}
    </button>`).join('') || `<div class="empty">${projects.length ? 'No matches' : 'No projects yet'}</div>`;
}

function renderHome() {
  const sel = $('homeProject');
  const prev = sel.value;
  sel.innerHTML = projects.map(p => `<option value="${esc(p.path)}">${esc(p.name)}</option>`).join('');
  if (prev && projectOf(prev)) sel.value = prev;

  $('recent').innerHTML = recent.map(s => `
    <button class="row" data-resume="${esc(s.id)}" data-cwd="${esc(s.cwd || '')}">
      ${ICON.chat}<span class="title">${esc(s.title)}</span>
      <span class="where">${esc(nameOf(s.cwd))}</span><span class="resume">Resume →</span><span class="when">${ago(s.mtime)}</span>
    </button>`).join('') || '<div class="empty">No Claude sessions yet. Start one above.</div>';

  $('cards').innerHTML = projects.map(p => `
    <button class="card" data-project="${esc(p.path)}">
      <div class="top">${avatar(p)}<b>${esc(p.name)}</b></div>
      <div class="path" title="${esc(p.path)}">${esc(p.path)}</div>
      <div class="badges">
        ${p.sessions ? `<span class="badge">${ICON.chat}${p.sessions}</span>` : ''}
        ${p.branch ? `<span class="badge">${ICON.branch}${esc(p.branch)}</span>` : ''}
        ${p.hasGraph ? `<span class="badge">${ICON.graph}graph</span>` : ''}
        <span class="badge">${ago(p.lastActive) || 'new'}</span>
      </div>
    </button>`).join('') || '<div class="empty">No projects found. Use <code>Add a folder</code> to pick one.</div>';
}

async function renderProject() {
  const p = projectOf(view.path);
  if (!p) return;
  $('pAvatar').outerHTML = avatar(p, 'big').replace('<span', '<span id="pAvatar"');
  $('pName').textContent = p.name;
  $('pPath').textContent = p.path;
  $('pChips').innerHTML = [
    p.branch && `<span class="chip">${ICON.branch}<b>${esc(p.branch)}</b></span>`,
    `<span class="chip">${ICON.chat}<b>${p.sessions}</b> sessions</span>`,
    p.hasGraph && `<span class="chip">${ICON.graph}graphify</span>`,
    p.lastActive && `<span class="chip">Active ${ago(p.lastActive)}</span>`,
  ].filter(Boolean).join('');
  $('unpinBtn').hidden = !p.pinned;

  const tabs = [['sessions', 'Sessions'], p.hasGraph && ['graph', 'Graph'], p.hasReport && ['report', 'Report']].filter(Boolean);
  if (!tabs.some(([k]) => k === projectTab)) projectTab = 'sessions';
  $('pTabs').innerHTML = tabs.map(([k, l]) => `<button role="tab" data-ptab="${k}" aria-selected="${k === projectTab}">${l}</button>`).join('');

  const body = $('pBody');
  if (projectTab === 'graph') {
    body.innerHTML = `<iframe class="graph-frame" src="${esc(p.graphUrl)}" title="Knowledge graph"></iframe>`;
  } else if (projectTab === 'report') {
    const md = await deck.report(p.path);
    // GRAPH_REPORT.md is generated locally by graphify, not fetched from the web
    body.innerHTML = `<article class="doc">${md ? marked.parse(md) : 'Report not found.'}</article>`;
  } else {
    body.innerHTML = '<div class="empty">Loading sessions…</div>';
    const list = p.claudeDir ? await deck.sessions(p.claudeDir) : [];
    if (view.type !== 'project' || !same(view.path, p.path) || projectTab !== 'sessions') return;
    body.innerHTML = list.length ? `<div class="rows">${list.map(s => `
      <button class="row" data-resume="${esc(s.id)}" data-cwd="${esc(p.path)}">
        ${ICON.chat}<span class="title">${esc(s.title)}</span><span class="resume">Resume →</span><span class="when">${ago(s.mtime)}</span>
      </button>`).join('')}</div>` : '<div class="empty">No Claude sessions in this folder yet.</div>';
  }
}

// ---------- terminals ----------
const THEME = {
  background: '#050505', foreground: '#e8e8e8', cursor: '#fcfcfc', cursorAccent: '#050505',
  selectionBackground: 'rgba(252,252,252,0.20)', selectionInactiveBackground: 'rgba(217,119,87,0.55)', // inactive = find bar has focus, so this marks the current match
  black: '#1c1c1c', red: '#f28b82', green: '#8ee3a0', yellow: '#fdd84a', blue: '#91a6f5', magenta: '#b8a1f5', cyan: '#6fd3ea', white: '#d6d6d6',
  brightBlack: '#5c5c5c', brightRed: '#ffa69e', brightGreen: '#a9f0b8', brightYellow: '#ffe57a', brightBlue: '#adbdfa', brightMagenta: '#cdbbfa', brightCyan: '#94e2f2', brightWhite: '#fcfcfc',
};

async function openTerm({ cwd, kind = 'claude', args = [], title }) {
  if (!cwd) return toast('Pick a project first.');
  const el = document.createElement('div');
  el.className = 'term';
  $('terms').appendChild(el);
  $('terms').hidden = false;
  const term = new Terminal({
    theme: THEME, fontFamily: '"Geist Mono", "Cascadia Mono", "DejaVu Sans Mono", monospace', fontSize: 13.5,
    lineHeight: 1.25, cursorBlink: true, cursorStyle: 'bar', allowProposedApi: true, scrollback: 10000, macOptionIsMeta: true,
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.loadAddon(new WebLinksAddon.WebLinksAddon());
  const search = new SearchAddon.SearchAddon();
  term.loadAddon(search);
  term.open(el);
  fit.fit();

  let id;
  try {
    id = await deck.spawn({ cwd, kind, args, cols: term.cols, rows: term.rows });
  } catch (err) {
    term.dispose(); el.remove();
    show(view.type === 'term' ? { type: 'home' } : view);
    return toast(errText(err));
  }
  const t = { term, fit, search, el, cwd, exited: false, title: title || (kind === 'shell' ? `Shell · ${nameOf(cwd)}` : nameOf(cwd)) };
  terms.set(id, t);
  search.onDidChangeResults(({ resultIndex, resultCount }) => {
    if (activeTerm() === t) $('findCount').textContent = resultCount ? `${resultIndex + 1}/${resultCount}` : 'No results';
  });

  term.onData(d => (t.exited ? closeTerm(id) : deck.write(id, d)));
  term.onResize(({ cols, rows }) => deck.resize(id, cols, rows));
  term.onTitleChange(s => { if (s && !/claude\.exe|^[A-Z]:\\/i.test(s)) { t.title = s.slice(0, 60); renderTabs(); } });
    // Ctrl+Shift+C copies, Ctrl+V / Ctrl+Shift+V paste text like Windows Terminal
  term.attachCustomKeyEventHandler(e => {
    if (e.type !== 'keydown' || !e.ctrlKey) return true;
    const k = e.key.toLowerCase();
    if (e.shiftKey && k === 'c') { deck.writeClip(term.getSelection()); return false; }
    if (e.shiftKey && k === 'f') { openFind(); return false; }
    if (e.shiftKey && k === 'p') { togglePreview(); return false; }
    if ((e.shiftKey && (k === 't' || k === 'w')) || k === 'tab') return false; // app shortcuts, not for the pty
    if (k === 'v') { deck.readClip().then(txt => txt && term.paste(txt)); return false; }
    return true;
  });
  el.addEventListener('contextmenu', async e => {
    e.preventDefault();
    if (term.hasSelection()) { await deck.writeClip(term.getSelection()); term.clearSelection(); toast('Copied'); }
    else { const txt = await deck.readClip(); if (txt) term.paste(txt); }
  });
  new ResizeObserver(() => { if (!el.hidden) fit.fit(); }).observe(el);

  show({ type: 'term', id });
}

deck.onData((id, d) => terms.get(id)?.term.write(d));
deck.onExit((id, code) => {
  const t = terms.get(id);
  if (!t) return;
  t.exited = true;
  t.term.write(`\r\n\x1b[90m─── session ended${code ? ` (exit ${code})` : ''} · press any key to close ───\x1b[0m\r\n`);
  renderTabs(); renderSidebar();
});

function closeTerm(id) {
  const t = terms.get(id);
  if (!t) return;
  if (!t.exited) deck.kill(id);
  t.term.dispose(); t.el.remove(); terms.delete(id);
  if (view.type === 'term' && view.id === id) {
    const last = [...terms.keys()].pop();
    show(last ? { type: 'term', id: last } : projectOf(t.cwd) ? { type: 'project', path: t.cwd } : { type: 'home' });
  } else renderTabs();
}

// ---------- find ----------
// overview ruler colours must be #RRGGBB
const FIND = { decorations: { matchBackground: '#3a3a3a', matchOverviewRuler: '#5c5c5c', activeMatchBackground: '#d97757', activeMatchColorOverviewRuler: '#d97757' } };
const activeTerm = () => (view.type === 'term' ? terms.get(view.id) : null);
function find(back, incremental = false) {
  const t = activeTerm(), q = $('findInput').value;
  if (!t) return;
  if (!q) { t.search.clearDecorations(); $('findCount').textContent = ''; return; }
  t.search[back ? 'findPrevious' : 'findNext'](q, { ...FIND, incremental });
}
function openFind() {
  if (!activeTerm()) return;
  $('find').hidden = false;
  $('findInput').select(); $('findInput').focus();
  if ($('findInput').value) find(false, true);
}
function closeFind() {
  if ($('find').hidden) return;
  $('find').hidden = true; $('findCount').textContent = '';
  activeTerm()?.search.clearDecorations();
}
$('findInput').oninput = () => find(false, true);
$('findInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); find(e.shiftKey); }
  if (e.key === 'Escape') { const t = activeTerm(); closeFind(); t?.term.focus(); }
});
$('find').onsubmit = e => e.preventDefault();
$('findPrev').onclick = () => find(true);
$('findNext').onclick = () => find(false);
$('findClose').onclick = () => { const t = activeTerm(); closeFind(); t?.term.focus(); };

// ---------- composer ----------
function wireComposer(form, cwdFn) {
  const ta = form.querySelector('textarea');
  const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  ta.addEventListener('input', grow);
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const prompt = ta.value.trim();
    openTerm({ cwd: cwdFn(), args: prompt ? [prompt] : [] });
    ta.value = ''; grow();
  });
}
wireComposer($('homeComposer'), () => $('homeProject').value);
wireComposer($('projectComposer'), () => view.path);

// ---------- events ----------
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-close],[data-term],[data-home],[data-project],[data-resume],[data-ptab],[data-act],[data-quick]');
  if (!el) return;
  const d = el.dataset;
  if (d.close) { e.stopPropagation(); return closeTerm(Number(d.close)); }
  if (d.term) return show({ type: 'term', id: Number(d.term) });
  if ('home' in d) return show({ type: 'home' });
  if (d.project) { projectTab = 'sessions'; return show({ type: 'project', path: d.project }); }
  if (d.resume) {
    const cwd = d.cwd || $('homeProject').value;
    const s = recent.find(r => r.id === d.resume);
    return openTerm({ cwd, args: ['--resume', d.resume], title: s?.title?.slice(0, 40) || el.querySelector('.title')?.textContent.slice(0, 40) });
  }
  if (d.ptab) { projectTab = d.ptab; return renderProject(); }
  if (d.act) {
    const cwd = view.path;
    if (d.act === 'new') return openTerm({ cwd });
    if (d.act === 'continue') return openTerm({ cwd, args: ['--continue'] });
    if (d.act === 'shell') return openTerm({ cwd, kind: 'shell' });
    if (d.act === 'open') return deck.openFolder(cwd);
    if (d.act === 'rea') {
      const target = await deck.pickTarget();
      if (target) openTerm({ cwd, args: [`Use REA to reverse engineer ${target}: explain how it works and show the evidence.`], title: `REA · ${nameOf(target)}` });
      return;
    }
    if (d.act === 'unpin') { await deck.unpin(cwd); return load(); }
  }
  if (d.quick) {
    const cwd = $('homeProject').value;
    if (d.quick === 'continue') return openTerm({ cwd, args: ['--continue'] });
    if (d.quick === 'shell') return openTerm({ cwd, kind: 'shell' });
    if (d.quick === 'folder') return addFolder();
    if (d.quick === 'rea') return openTerm({ cwd, kind: 'rea-setup', title: 'REA setup' });
  }
});

// ---------- usage ----------
const resetsIn = iso => {
  const ms = new Date(iso) - Date.now();
  if (!(ms > 0)) return 'now';
  if (ms < 86400000) { const m = Math.round(ms / 60000); return `in ${m >= 60 ? `${Math.floor(m / 60)}h ` : ''}${m % 60}m`; }
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
};
const meter = (label, w) => {
  if (!w) return '';
  // a cached reading from before the window reset is stale; the window starts again at 0
  const pct = new Date(w.resets_at) < Date.now() ? 0 : Math.round(w.utilization);
  return `<div class="meter" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
    <div class="meter-top"><span>${label}</span><b>${pct}%</b></div>
    <div class="track"><div class="fill ${pct >= 90 ? 'hot' : ''}" style="width:${Math.min(100, pct)}%"></div></div>
    <small>Resets ${resetsIn(w.resets_at)}</small></div>`;
};
// the last good reading survives restarts, so an expired login or offline start still shows numbers
const cachedUsage = () => { try { return JSON.parse(localStorage.usage); } catch { return null; } };
const renderUsage = u => ($('usage').innerHTML = meter('Session (5h)', u.session) + meter('Week', u.week) +
  (u.error ? `<small class="dim">${esc(u.error)}${u.at ? ` Showing figures from ${ago(u.at)}.` : ''}</small>` : ''));
async function loadUsage() {
  const u = await deck.usage();
  if (!u.error) try { localStorage.usage = JSON.stringify({ ...u, at: Date.now() }); } catch { /* storage unavailable */ }
  renderUsage(u.error ? { ...cachedUsage(), error: u.error } : u);
}
setInterval(loadUsage, 5 * 60000);

// ---------- preview ----------
let previewFiles = []; // newest first: { file, cwd }
let previewFile = null;
async function renderPreview() {
  if ($('preview').hidden) return;
  const pick = $('previewPick');
  pick.innerHTML = previewFiles.map(f => `<option value="${esc(f.file)}">${esc(f.file.slice(f.cwd.length + 1))} · ${esc(nameOf(f.cwd))}</option>`).join('');
  pick.hidden = !previewFiles.length;
  const body = $('previewBody');
  if (!previewFile) return (body.innerHTML = '<div class="empty">HTML pages and images your sessions create show up here.</div>');
  pick.value = previewFile;
  const url = await deck.previewRead(previewFile);
  const src = esc(`${url}?t=${Date.now()}`); // same URL after an edit would show the cached copy
  if (!url) body.innerHTML = '<div class="empty">This file is gone.</div>';
  else if (/\.html?$/i.test(previewFile)) body.innerHTML = `<iframe sandbox="allow-scripts" src="${src}" title="Preview"></iframe>`;
  else body.innerHTML = `<img src="${src}" alt="">`;
}
function togglePreview(open = $('preview').hidden) {
  $('preview').hidden = !open;
  $('previewBtn').setAttribute('aria-pressed', open);
  if (open) $('previewBtn').classList.remove('fresh');
  try { localStorage.preview = open ? '1' : ''; } catch { /* storage unavailable */ }
  renderPreview();
}
deck.onPreviewFile((file, cwd) => {
  previewFiles = [{ file, cwd }, ...previewFiles.filter(f => f.file !== file)].slice(0, 30);
  previewFile = file;
  if ($('preview').hidden) $('previewBtn').classList.add('fresh');
  // one save fires several watch events
  clearTimeout(renderPreview.timer); renderPreview.timer = setTimeout(renderPreview, 250);
});
$('previewPick').onchange = e => { previewFile = e.target.value; renderPreview(); };
$('previewBtn').onclick = () => togglePreview();
$('previewClose').onclick = () => togglePreview(false);
try { togglePreview(localStorage.preview === '1'); } catch { togglePreview(false); }

// ---------- updates ----------
const updateLabel = s => ($('updateBtn').querySelector('span').textContent = s);
function updateProgress(step, pct) {
  $('updateBox').hidden = pct == null;
  $('updateStep').textContent = step;
  $('updatePct').textContent = `${pct}%`;
  $('updateProgress').setAttribute('aria-valuenow', pct ?? 0);
  $('updateProgress').firstElementChild.style.width = `${pct ?? 0}%`;
}
deck.onUpdateStep((s, pct) => { updateLabel('Updating…'); updateProgress(s, pct); });
$('updateBtn').onclick = async () => {
  const btn = $('updateBtn');
  btn.disabled = true; updateLabel('Checking…');
  try {
    const { available, version } = await deck.updateCheck();
    if (!available) return toast('Claude Deck is up to date.');
    const open = [...terms.values()].filter(t => !t.exited).length;
    if (!confirm(`Version ${version} is available. Update and restart Claude Deck?${open ? `\n\nThis closes ${open} open terminal tab${open > 1 ? 's' : ''}.` : ''}`)) return;
    await deck.updateInstall();
  } catch (err) {
    toast(errText(err));
  } finally { btn.disabled = false; updateLabel('Updates'); updateProgress('', null); }
};

// ---------- new GitHub repos ----------
const ghRow = (kind, key, name, detail) => `
    <label class="gh-row"><input type="checkbox" value="${esc(key)}" data-kind="${kind}" checked>
      <span class="grow"><b>${esc(name)}</b><small>${esc(detail)}</small></span>
      <span class="gh-status" aria-live="polite"></span></label>`;
async function checkGithub() {
  const [fresh, behind] = await Promise.all([deck.githubNew(), deck.githubBehind()]);
  if (!fresh.length && !behind.length) return;
  $('ghList').innerHTML =
    (fresh.length ? `<h3>Not on this computer</h3>${fresh.map(r => ghRow('clone', r.nameWithOwner, r.name, r.description || r.nameWithOwner)).join('')}` : '') +
    (behind.length ? `<h3>Behind GitHub</h3>${behind.map(r => ghRow('pull', r.path, r.name,
      `${r.behind} new commit${r.behind > 1 ? 's' : ''} on ${r.branch || 'the current branch'}`)).join('')}` : '');
  $('ghDialog').showModal();
}
const ghBoxes = () => [...$('ghList').querySelectorAll('input')];
$('ghLater').onclick = () => $('ghDialog').close();
$('ghIgnore').onclick = async () => { await deck.githubIgnore(ghBoxes().map(b => b.value)); $('ghDialog').close(); };
$('ghClone').onclick = async () => {
  const picked = ghBoxes().filter(b => b.checked && !b.disabled);
  if (!picked.length) return $('ghDialog').close();
  const buttons = $('ghDialog').querySelectorAll('button');
  buttons.forEach(b => (b.disabled = true));
  let failed = 0;
  for (const box of picked) {
    const status = box.closest('.gh-row').querySelector('.gh-status');
    status.className = 'gh-status'; status.textContent = 'Pulling…';
    try { await (box.dataset.kind === 'pull' ? deck.githubPull : deck.githubClone)(box.value); status.textContent = 'Done'; box.disabled = true; }
    catch (err) { failed++; status.className = 'gh-status err'; status.textContent = errText(err); }
  }
  buttons.forEach(b => (b.disabled = false));
  await load();
  if (!failed) { $('ghDialog').close(); toast(`Pulled ${picked.length} project${picked.length > 1 ? 's' : ''} from GitHub.`); }
};

// ---------- addon sync ----------
let addonState = null;
const addonButtons = () => $('addonDialog').querySelectorAll('button:not(#addonClose)');
// fn returns the result line, shown under the status (a toast is gone before a secrets warning can be read)
async function addonRun(label, fn) {
  addonButtons().forEach(b => (b.disabled = true));
  $('addonStatus').textContent = label;
  let msg;
  try { msg = await fn(); } catch (err) { msg = errText(err); }
  await addonRefresh();
  if (msg) $('addonStatus').insertAdjacentHTML('beforeend', `<br><br>${esc(msg)}`);
}
async function addonRefresh() {
  addonButtons().forEach(b => (b.disabled = true));
  try { addonState = await deck.addonStatus(); }
  catch (err) { addonState = null; $('addonStatus').textContent = errText(err); return; }
  const { login, main, isMain } = addonState;
  $('addonStatus').innerHTML = `GitHub account <b>${esc(login)}</b>. ${isMain ? 'This is the <b>main install</b>: push from here, pull everywhere else.'
    : main ? `The main install is <b>${esc(main.name)}</b>. Only it can push; this computer can pull.`
    : 'No main install yet: any computer can push. Make your best-set-up computer the main install.'}`;
  addonButtons().forEach(b => (b.disabled = false));
  $('addonMain').hidden = isMain;
  $('addonPush').disabled = !!main && !isMain;
}
$('addonBtn').onclick = () => { $('addonDialog').showModal(); $('addonStatus').textContent = 'Checking GitHub…'; addonRefresh(); };
$('addonClose').onclick = () => $('addonDialog').close();
$('addonMain').onclick = () => {
  const other = addonState?.main;
  if (other && !confirm(`${other.name} is the main install now. Make this computer the main install instead?`)) return;
  addonRun('Making this the main install…', () => deck.addonMain());
};
$('addonPush').onclick = () => {
  if (!confirm('Replace the addons on GitHub with this computer\'s?')) return;
  addonRun('Pushing…', async () => {
    const r = await deck.addonPush();
    return r.changed ? `Pushed plugins, ${r.skills} skills, MCP servers and hooks.` : 'GitHub already has these addons.';
  });
};
$('addonPull').onclick = () => {
  if (!confirm('Replace this computer\'s CLAUDE.md, hooks and same-named skills with the ones on GitHub? Plugins and MCP servers are merged in.')) return;
  addonRun('Pulling…', async () => {
    const r = await deck.addonPull();
    return [`Pulled ${r.plugins} plugins and ${r.skills} skills${r.from ? ` from ${r.from}` : ''}. Restart Claude sessions to load them.`,
      !r.sameOs && 'Hooks and MCP servers were left alone: they were pushed from a different OS.',
      r.needSecrets.length && `Add the secrets for ${r.needSecrets.join(', ')} in ~/.claude.json.`,
      `The old files are backed up in ${r.backup}.`,
    ].filter(Boolean).join(' ');
  });
};

async function addFolder() {
  const dir = await deck.pickFolder();
  if (!dir) return;
  await load();
  show({ type: 'project', path: dir });
}

$('newBtn').onclick = () => { show({ type: 'home' }); $('homeComposer').querySelector('textarea').focus(); };
$('addFolder').onclick = addFolder;
$('refresh').onclick = async () => { await Promise.all([load(), loadUsage()]); toast(`${projects.length} projects found`); };
$('search').oninput = renderSidebar;
document.addEventListener('keydown', e => {
  if (!e.ctrlKey) return;
  const k = e.key.toLowerCase();
  if (e.shiftKey && k === 't') { e.preventDefault(); $('newBtn').click(); }
  if (e.shiftKey && k === 'w' && view.type === 'term') { e.preventDefault(); closeTerm(view.id); }
  if (e.shiftKey && k === 'f' && view.type === 'term') { e.preventDefault(); openFind(); }
  if (e.shiftKey && k === 'p' && !e.target.closest('.xterm')) { e.preventDefault(); togglePreview(); }
  if (e.key === 'Tab' && terms.size) {
    e.preventDefault();
    const ids = [...terms.keys()];
    const i = view.type === 'term' ? ids.indexOf(view.id) : -1;
    show({ type: 'term', id: ids[(i + (e.shiftKey ? -1 : 1) + ids.length) % ids.length] });
  }
});

load().then(() => { show({ type: 'home' }); checkGithub(); });
if (cachedUsage()) renderUsage(cachedUsage());
loadUsage();
deck.version().then(v => ($('version').textContent = v));
