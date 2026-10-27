# Graph Report - claude-deck  (2026-10-27)

## Corpus Check
- 8 files · ~9,718 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 193 nodes · 328 edges · 7 communities
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b1854e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Package Dependencies
- Renderer UI Logic
- Installer Build Config
- App Features & Window
- Project Discovery Lib
- Electron Main Process
- npm Scripts

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
- `marked Markdown Renderer` --conceptually_related_to--> `Graphify Graph and Report Viewer`  [INFERRED]
  index.html → README.md
- `Project View (actions, composer, segmented tabs)` --implements--> `Graphify Graph and Report Viewer`  [INFERRED]
  index.html → README.md
- `Open Sessions Tab Bar` --implements--> `Claude Sessions in Real Terminal Tabs`  [INFERRED]
  index.html → README.md
- `Keyboard Shortcuts` --conceptually_related_to--> `Open Sessions Tab Bar`  [INFERRED]
  README.md → index.html
- `Projects Sidebar (search, list, add folder, refresh)` --implements--> `Project Discovery (claude projects, git repos, graphify-out, added folders)`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Main window views driven by renderer.js** — index_home_view, index_project_view, index_terms_view, index_sidebar, renderer [INFERRED 0.85]

## Communities (7 total, 0 thin omitted)

### Community 0 - "Package Dependencies"
Cohesion: 0.07
Nodes (36): author, dependencies, electron-updater@^6.8.11, @fontsource/geist-mono@^5.3.0, @fontsource-variable/inter@^5.3.0, @lydell/node-pty@^1.2.0-beta.18, marked@^18.1.1, @xterm/addon-fit@^0.11.0 (+28 more)

### Community 1 - "Renderer UI Logic"
Cohesion: 0.10
Nodes (43): Home View (composer, quick actions, recent sessions, project cards), activeTerm(), addFolder(), addonButtons(), addonRefresh(), addonRun(), ago(), avatar() (+35 more)

### Community 2 - "Installer Build Config"
Cohesion: 0.09
Nodes (23): artifactName, build, appId, appImage, asarUnpack, directories, files, linux (+15 more)

### Community 3 - "App Features & Window"
Cohesion: 0.15
Nodes (14): index.html Main Window, marked Markdown Renderer, Project View (actions, composer, segmented tabs), Open Sessions Tab Bar, Projects Sidebar (search, list, add folder, refresh), Terminals View, xterm.js with fit and web-links addons, Claude Deck (+6 more)

### Community 4 - "Project Discovery Lib"
Cohesion: 0.16
Nodes (16): cwdOf(), exists(), findClaude(), gitBranch(), gitRemote(), jsonlFiles(), key(), listProjects() (+8 more)

### Community 5 - "Electron Main Process"
Cohesion: 0.10
Nodes (20): CLAUDE_PROJECTS, commitPush(), git(), ignoredFile(), installId(), isDir(), offered, offeredPull (+12 more)

### Community 6 - "npm Scripts"
Cohesion: 0.26
Nodes (16): copyFile(), copySkill(), detokenize(), exportAddons(), homeForms(), importAddons(), mapStrings(), mergeServers() (+8 more)

## Knowledge Gaps
- **3 isolated node(s):** `Home View (composer, quick actions, recent sessions, project cards)`, `styles.css`, `npm test Discovery Self-Check`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 64 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build` connect `Installer Build Config` to `Package Dependencies`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **What connects `Home View (composer, quick actions, recent sessions, project cards)`, `styles.css`, `npm test Discovery Self-Check` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06827880512091039 - nodes in this community are weakly interconnected._
- **Why does `electron` connect `Package Dependencies` to `Electron Main Process`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `Renderer UI Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.10083256244218317 - nodes in this community are weakly interconnected._
- **Why does `@lydell/node-pty` connect `Package Dependencies` to `Electron Main Process`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `Installer Build Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._