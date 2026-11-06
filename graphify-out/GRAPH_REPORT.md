# Graph Report - claude-deck  (2026-11-06)

## Corpus Check
- 5 files · ~9,994 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 215 nodes · 353 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.85)
- Token cost: 53,625 input · 0 output

## Community Hubs (Navigation)
- Renderer UI Logic
- Package Dependencies (1)
- Main Process Repo Sync
- Project and Session Discovery
- Electron Builder Config
- Addons Export and Import
- Inarch App Overview
- Sync and Release Features (7)
- Package Dependencies (8)
- Sync and Release Features (9)
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
- `Inarch (formerly Claude Deck)` --implements--> `electron`  [EXTRACTED]
  README.md → package.json
- `Home view (composer, quick actions, recent sessions, project cards)` --implements--> `REA (Reverse Engineer Anything)`  [INFERRED]
  index.html → README.md
- `Inarch main window (index.html)` --implements--> `Inarch (formerly Claude Deck)`  [INFERRED]
  index.html → README.md
- `Project view (actions, composer, tabs)` --implements--> `REA (Reverse Engineer Anything)`  [INFERRED]
  index.html → README.md
- `Sidebar (new session, search, project list, footer)` --implements--> `Project Discovery`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Addons sync via gh** — readme_addons_sync, readme_github_cli, readme_claude_deck_sync_repo, readme_main_install, readme_mcp_secret_redaction [EXTRACTED 1.00]
- **Release pipeline** — readme_release_script, readme_proxmox_win11_vm, readme_github_releases, readme_windows_installer, readme_linux_appimage, readme_auto_updater [EXTRACTED 1.00]
- **Terminal session UI stack** — index_terms_view, index_find_bar, index_xterm, renderer, index_titlebar [INFERRED 0.85]

## Communities (11 total, 2 thin omitted)

### Community 0 - "Renderer UI Logic"
Cohesion: 0.09
Nodes (47): Find-in-terminal bar, marked (Markdown renderer), Preview pane (generated file picker), Terminals view (#terms), xterm.js + fit/web-links/search addons, activeTerm(), addFolder(), addonButtons() (+39 more)

### Community 1 - "Package Dependencies (1)"
Cohesion: 0.08
Nodes (32): author, dependencies, electron-updater@^6.8.11, @fontsource/geist-mono@^5.3.0, @fontsource-variable/inter@^5.3.0, @lydell/node-pty@^1.2.0-beta.18, marked@^18.1.1, @xterm/addon-fit@^0.11.0 (+24 more)

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

### Community 6 - "Inarch App Overview"
Cohesion: 0.16
Nodes (15): Content-Security-Policy (self-only scripts), Home view (composer, quick actions, recent sessions, project cards), Inarch main window (index.html), Project view (actions, composer, tabs), Sidebar (new session, search, project list, footer), Update progress box (#updateBox), Usage meter (#usage), Claude Code (+7 more)

### Community 7 - "Sync and Release Features (7)"
Cohesion: 0.18
Nodes (11): Sync addons dialog (#addonDialog), Addons Sync, Updates (auto-updater), claude-deck-sync private repo, GitHub CLI (gh), GitHub Releases, Linux AppImage, npm run dist (+3 more)

### Community 8 - "Package Dependencies (8)"
Cohesion: 0.40
Nodes (5): scripts, dist, release, start, test

## Knowledge Gaps
- **13 isolated node(s):** `Updates from GitHub dialog (#ghDialog)`, `Update progress box (#updateBox)`, `Content-Security-Policy (self-only scripts)`, `Home view (composer, quick actions, recent sessions, project cards)`, `Preview pane (generated file picker)` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 75 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `Package Dependencies (1)` to `Main Process Repo Sync`, `Inarch App Overview`?**
  _High betweenness centrality (0.506) - this node is a cross-community bridge._
- **What connects `Updates from GitHub dialog (#ghDialog)`, `Update progress box (#updateBox)`, `Content-Security-Policy (self-only scripts)` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Renderer UI Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.08862745098039215 - nodes in this community are weakly interconnected._
- **Why does `Inarch (formerly Claude Deck)` connect `Inarch App Overview` to `Package Dependencies (1)`?**
  _High betweenness centrality (0.455) - this node is a cross-community bridge._
- **Should `Package Dependencies (1)` be split into smaller, more focused modules?**
  _Cohesion score 0.0784313725490196 - nodes in this community are weakly interconnected._
- **Why does `Inarch main window (index.html)` connect `Inarch App Overview` to `Renderer UI Logic`?**
  _High betweenness centrality (0.367) - this node is a cross-community bridge._
- **Should `Main Process Repo Sync` be split into smaller, more focused modules?**
  _Cohesion score 0.09852216748768473 - nodes in this community are weakly interconnected._