# Graph Report - claude-deck  (2026-11-13)

## Corpus Check
- 8 files · ~11,403 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 225 nodes · 367 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Renderer UI Logic
- Package Dependencies
- Inarch App Overview
- Main Process Repo Sync
- Project and Session Discovery
- Electron Builder Config
- Addons Export and Import
- Screen Capture MCP
- GitHub Updates Dialog
- Titlebar

## God Nodes (most connected - your core abstractions)
1. `build` - 11 edges
2. `esc()` - 11 edges
3. `openTerm()` - 11 edges
4. `Inarch (formerly Claude Deck)` - 10 edges
5. `listProjects()` - 9 edges
6. `show()` - 9 edges
7. `exportAddons()` - 8 edges
8. `importAddons()` - 8 edges
9. `projectOf()` - 7 edges
10. `renderSidebar()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `electron@^45.0.0` --declares--> `Electron`  [EXTRACTED]
  package.json → README.md
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
- **Terminal session UI stack** — index_terms_view, index_find_bar, index_xterm, renderer, index_titlebar [INFERRED 0.85]
- **Release pipeline: build, publish, auto-update** — readme_release_process, readme_proxmox_win11_vm, readme_installers, readme_github_releases, readme_updates [INFERRED 0.85]
- **gh-backed GitHub sync features** — readme_github_cli, readme_github_repo_sync, readme_addons, readme_claude_deck_sync_repo [INFERRED 0.85]

## Communities (10 total, 2 thin omitted)

### Community 0 - "Renderer UI Logic"
Cohesion: 0.09
Nodes (47): Find-in-terminal bar, marked (Markdown renderer), Preview pane (generated file picker), Terminals view (#terms), xterm.js + fit/web-links/search addons, activeTerm(), addFolder(), addonButtons() (+39 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.07
Nodes (37): author, dependencies, electron-updater@^6.8.11, @fontsource/geist-mono@^5.3.0, @fontsource-variable/inter@^5.3.0, @lydell/node-pty@^1.2.0-beta.18, marked@^18.1.1, @xterm/addon-fit@^0.11.0 (+29 more)

### Community 2 - "Inarch App Overview"
Cohesion: 0.08
Nodes (27): Sync addons dialog (#addonDialog), Content-Security-Policy (self-only scripts), Home view (composer, quick actions, recent sessions, project cards), Inarch main window (index.html), Project view (actions, composer, tabs), Sidebar (new session, search, project list, footer), Update progress box (#updateBox), Usage meter (#usage) (+19 more)

### Community 3 - "Main Process Repo Sync"
Cohesion: 0.10
Nodes (20): CLAUDE_PROJECTS, commitPush(), git(), ignoredFile(), installId(), isDir(), offered, offeredPull (+12 more)

### Community 4 - "Project and Session Discovery"
Cohesion: 0.16
Nodes (16): cwdOf(), exists(), findClaude(), gitBranch(), gitRemote(), jsonlFiles(), key(), listProjects() (+8 more)

### Community 5 - "Electron Builder Config"
Cohesion: 0.09
Nodes (23): artifactName, build, appId, appImage, asarUnpack, directories, files, linux (+15 more)

### Community 6 - "Addons Export and Import"
Cohesion: 0.26
Nodes (16): copyFile(), copySkill(), detokenize(), exportAddons(), homeForms(), importAddons(), mapStrings(), mergeServers() (+8 more)

### Community 7 - "Screen Capture MCP"
Cohesion: 0.32
Nodes (5): capture(), handle(), lastPrompt(), saysLook(), TOOLS

## Knowledge Gaps
- **15 isolated node(s):** `Preview pane (generated file picker)`, `Titlebar (brand, version, session tabs, preview toggle)`, `Find-in-terminal bar`, `Terminals view (#terms)`, `Content-Security-Policy (self-only scripts)` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 80 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Electron` connect `Package Dependencies` to `Inarch App Overview`, `Main Process Repo Sync`?**
  _High betweenness centrality (0.498) - this node is a cross-community bridge._
- **What connects `Preview pane (generated file picker)`, `Titlebar (brand, version, session tabs, preview toggle)`, `Find-in-terminal bar` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Renderer UI Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.08862745098039215 - nodes in this community are weakly interconnected._
- **Why does `Inarch (formerly Claude Deck)` connect `Inarch App Overview` to `Package Dependencies`?**
  _High betweenness centrality (0.496) - this node is a cross-community bridge._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06612685560053981 - nodes in this community are weakly interconnected._
- **Why does `Inarch main window (index.html)` connect `Inarch App Overview` to `Renderer UI Logic`?**
  _High betweenness centrality (0.356) - this node is a cross-community bridge._
- **Should `Inarch App Overview` be split into smaller, more focused modules?**
  _Cohesion score 0.07575757575757576 - nodes in this community are weakly interconnected._