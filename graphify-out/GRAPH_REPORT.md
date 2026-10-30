# Graph Report - claude-deck  (2026-10-30)

## Corpus Check
- Corpus is ~9,736 words - fits in a single context window. You may not need a graph.

## Summary
- 209 nodes · 343 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Renderer UI Logic
- Package Dependencies
- Main Process Repo Sync
- Project and Session Discovery
- Electron Builder Config
- Addons Export and Import
- Sync and Release Features
- Inarch App Overview
- Terminal Views
- Titlebar

## God Nodes (most connected - your core abstractions)
1. `build` - 11 edges
2. `esc()` - 11 edges
3. `openTerm()` - 11 edges
4. `listProjects()` - 9 edges
5. `show()` - 9 edges
6. `exportAddons()` - 8 edges
7. `importAddons()` - 8 edges
8. `projectOf()` - 7 edges
9. `renderSidebar()` - 7 edges
10. `renderHome()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Inarch main window (index.html)` --implements--> `Inarch (formerly Claude Deck)`  [INFERRED]
  index.html → README.md
- `Sidebar (new session, search, project list, footer)` --implements--> `Project discovery (~/.claude/projects, git repos, graphify-out, added folders)`  [INFERRED]
  index.html → README.md
- `Preview pane (generated file picker)` --implements--> `Graphify graph and report viewer`  [INFERRED]
  index.html → README.md
- `Home view (composer, quick actions, recent sessions, project cards)` --implements--> `REA (Reverse Engineer Anything) integration`  [INFERRED]
  index.html → README.md
- `Project view (actions, composer, tabs)` --implements--> `REA (Reverse Engineer Anything) integration`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Addons sync across computers** — readme_addons, readme_claude_deck_sync_repo, readme_main_install, readme_mcp_secret_redaction, index_addon_dialog [EXTRACTED 1.00]
- **Release build and in-app update** — readme_release_pipeline, readme_proxmox_win11_vm, readme_versioning, readme_updates, index_update_box [INFERRED 0.85]
- **Terminal session UI stack** — index_terms_view, index_find_bar, index_xterm, renderer, index_titlebar [INFERRED 0.85]

## Communities (10 total, 1 thin omitted)

### Community 0 - "Renderer UI Logic"
Cohesion: 0.10
Nodes (42): activeTerm(), addFolder(), addonButtons(), addonRefresh(), addonRun(), ago(), avatar(), cachedUsage() (+34 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.07
Nodes (36): author, dependencies, electron-updater@^6.8.11, @fontsource/geist-mono@^5.3.0, @fontsource-variable/inter@^5.3.0, @lydell/node-pty@^1.2.0-beta.18, marked@^18.1.1, @xterm/addon-fit@^0.11.0 (+28 more)

### Community 2 - "Main Process Repo Sync"
Cohesion: 0.10
Nodes (20): CLAUDE_PROJECTS, commitPush(), git(), ignoredFile(), installId(), isDir(), offered, offeredPull (+12 more)

### Community 3 - "Project and Session Discovery"
Cohesion: 0.16
Nodes (16): cwdOf(), exists(), findClaude(), gitBranch(), gitRemote(), jsonlFiles(), key(), listProjects() (+8 more)

### Community 4 - "Electron Builder Config"
Cohesion: 0.09
Nodes (23): artifactName, build, appId, appImage, asarUnpack, directories, files, linux (+15 more)

### Community 5 - "Addons Export and Import"
Cohesion: 0.26
Nodes (16): copyFile(), copySkill(), detokenize(), exportAddons(), homeForms(), importAddons(), mapStrings(), mergeServers() (+8 more)

### Community 6 - "Sync and Release Features"
Cohesion: 0.16
Nodes (9): Sync addons dialog (#addonDialog), Updates from GitHub dialog (#ghDialog), Update progress box (#updateBox), Addons sync (plugins, skills, MCP servers, hooks, CLAUDE.md), claude-deck-sync private repo, GitHub CLI (gh), Proxmox Win11 build VM (VM 111, QEMU guest agent), npm run release pipeline (+1 more)

### Community 7 - "Inarch App Overview"
Cohesion: 0.16
Nodes (13): Content-Security-Policy (self-only scripts), Home view (composer, quick actions, recent sessions, project cards), Inarch main window (index.html), marked (Markdown renderer), Preview pane (generated file picker), Project view (actions, composer, tabs), Sidebar (new session, search, project list, footer), Usage meter (#usage) (+5 more)

### Community 8 - "Terminal Views"
Cohesion: 0.50
Nodes (4): Find-in-terminal bar, Terminals view (#terms), xterm.js + fit/web-links/search addons, Keyboard shortcuts

## Knowledge Gaps
- **8 isolated node(s):** `Proxmox Win11 build VM (VM 111, QEMU guest agent)`, `Keyboard shortcuts`, `Content-Security-Policy (self-only scripts)`, `Titlebar (brand, version, session tabs, preview toggle)`, `Home view (composer, quick actions, recent sessions, project cards)` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 71 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build` connect `Electron Builder Config` to `Package Dependencies`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **What connects `Proxmox Win11 build VM (VM 111, QEMU guest agent)`, `Keyboard shortcuts`, `Content-Security-Policy (self-only scripts)` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Renderer UI Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.10434782608695652 - nodes in this community are weakly interconnected._
- **Why does `electron` connect `Package Dependencies` to `Main Process Repo Sync`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06827880512091039 - nodes in this community are weakly interconnected._
- **Why does `@lydell/node-pty` connect `Package Dependencies` to `Main Process Repo Sync`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `Main Process Repo Sync` be split into smaller, more focused modules?**
  _Cohesion score 0.09852216748768473 - nodes in this community are weakly interconnected._