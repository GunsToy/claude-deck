# Graph Report - claude-deck  (2026-11-13)

## Corpus Check
- 9 files · ~11,403 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 223 nodes · 365 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6706a52f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Renderer UI Logic
- Package Dependencies
- Main Process Repo Sync
- Project and Session Discovery
- Electron Builder Config
- Addons Export and Import
- Sync and Release Features
- Inarch App Overview
- screen-mcp.js
- Titlebar
- Titlebar (brand, version, session tabs, preview toggle)
- xterm.js + fit/web-links/search addons

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

## Communities (12 total, 2 thin omitted)

### Community 0 - "Renderer UI Logic"
Cohesion: 0.10
Nodes (44): marked (Markdown renderer), Preview pane (generated file picker), activeTerm(), addFolder(), addonButtons(), addonRefresh(), addonRun(), ago() (+36 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.07
Nodes (37): author, dependencies, electron-updater@^6.8.11, @fontsource/geist-mono@^5.3.0, @fontsource-variable/inter@^5.3.0, @lydell/node-pty@^1.2.0-beta.18, marked@^18.1.1, @xterm/addon-fit@^0.11.0 (+29 more)

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
Nodes (15): Content-Security-Policy (self-only scripts), Home view (composer, quick actions, recent sessions, project cards), Inarch main window (index.html), Project view (actions, composer, tabs), Sidebar (new session, search, project list, footer), Update progress box (#updateBox), Usage meter (#usage), Claude Code (+7 more)

### Community 7 - "Inarch App Overview"
Cohesion: 0.18
Nodes (11): Sync addons dialog (#addonDialog), Addons Sync, Updates (auto-updater), claude-deck-sync private repo, GitHub CLI (gh), GitHub Releases, Linux AppImage, npm run dist (+3 more)

### Community 8 - "screen-mcp.js"
Cohesion: 0.32
Nodes (5): capture(), handle(), lastPrompt(), saysLook(), TOOLS

### Community 11 - "xterm.js + fit/web-links/search addons"
Cohesion: 0.67
Nodes (3): Find-in-terminal bar, Terminals view (#terms), xterm.js + fit/web-links/search addons

## Knowledge Gaps
- **13 isolated node(s):** `Find-in-terminal bar`, `Preview pane (generated file picker)`, `Terminals view (#terms)`, `Titlebar (brand, version, session tabs, preview toggle)`, `Content-Security-Policy (self-only scripts)` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 77 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `Package Dependencies` to `Main Process Repo Sync`, `Sync and Release Features`?**
  _High betweenness centrality (0.501) - this node is a cross-community bridge._
- **What connects `Find-in-terminal bar`, `Preview pane (generated file picker)`, `Terminals view (#terms)` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Renderer UI Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.0975177304964539 - nodes in this community are weakly interconnected._
- **Why does `Inarch (formerly Claude Deck)` connect `Sync and Release Features` to `Package Dependencies`?**
  _High betweenness centrality (0.444) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06612685560053981 - nodes in this community are weakly interconnected._
- **Why does `Inarch main window (index.html)` connect `Sync and Release Features` to `Renderer UI Logic`?**
  _High betweenness centrality (0.358) - this node is a cross-community bridge._
- **Should `Main Process Repo Sync` be split into smaller, more focused modules?**
  _Cohesion score 0.09852216748768473 - nodes in this community are weakly interconnected._