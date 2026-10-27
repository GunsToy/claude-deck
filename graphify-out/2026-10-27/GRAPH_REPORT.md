# Graph Report - claude-deck  (2026-10-26)

## Corpus Check
- Corpus is ~4,112 words - fits in a single context window. You may not need a graph.

## Summary
- 124 nodes · 197 edges · 7 communities
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.82)
- Token cost: 49,194 input · 0 output

## Community Hubs (Navigation)
- Package Dependencies
- Renderer UI Logic
- Installer Build Config
- App Features & Window
- Project Discovery Lib
- Electron Main Process
- npm Scripts

## God Nodes (most connected - your core abstractions)
1. `build` - 9 edges
2. `listProjects()` - 8 edges
3. `show()` - 8 edges
4. `projectOf()` - 7 edges
5. `renderSidebar()` - 7 edges
6. `renderHome()` - 7 edges
7. `renderProject()` - 7 edges
8. `openTerm()` - 7 edges
9. `esc()` - 6 edges
10. `avatar()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Projects Sidebar (search, list, add folder, refresh)` --implements--> `Project Discovery (claude projects, git repos, graphify-out, added folders)`  [INFERRED]
  index.html → README.md
- `Content Security Policy (self-only scripts, file: frames)` --rationale_for--> `Graphify Graph and Report Viewer`  [INFERRED]
  index.html → README.md
- `marked Markdown Renderer` --conceptually_related_to--> `Graphify Graph and Report Viewer`  [INFERRED]
  index.html → README.md
- `Project View (actions, composer, segmented tabs)` --implements--> `Graphify Graph and Report Viewer`  [INFERRED]
  index.html → README.md
- `Open Sessions Tab Bar` --implements--> `Claude Sessions in Real Terminal Tabs`  [INFERRED]
  index.html → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Main window views driven by renderer.js** — index_home_view, index_project_view, index_terms_view, index_sidebar, renderer [INFERRED 0.85]

## Communities (7 total, 0 thin omitted)

### Community 0 - "Package Dependencies"
Cohesion: 0.09
Nodes (27): author, dependencies, @fontsource/geist-mono@^5.3.0, @fontsource-variable/inter@^5.3.0, @lydell/node-pty@^1.2.0-beta.18, marked@^18.1.1, @xterm/addon-fit@^0.11.0, @xterm/addon-web-links@^0.12.0 (+19 more)

### Community 1 - "Renderer UI Logic"
Cohesion: 0.19
Nodes (25): Home View (composer, quick actions, recent sessions, project cards), addFolder(), ago(), avatar(), closeTerm(), esc(), hue(), ICON (+17 more)

### Community 2 - "Installer Build Config"
Cohesion: 0.11
Nodes (19): build, appId, asarUnpack, directories, files, linux, nsis, productName (+11 more)

### Community 3 - "App Features & Window"
Cohesion: 0.15
Nodes (14): index.html Main Window, marked Markdown Renderer, Project View (actions, composer, segmented tabs), Open Sessions Tab Bar, Projects Sidebar (search, list, add folder, refresh), Terminals View, xterm.js with fit and web-links addons, Claude Deck (+6 more)

### Community 4 - "Project Discovery Lib"
Cohesion: 0.25
Nodes (15): cwdOf(), exists(), findClaude(), gitBranch(), jsonlFiles(), key(), listProjects(), readHead() (+7 more)

### Community 5 - "Electron Main Process"
Cohesion: 0.19
Nodes (5): CLAUDE_PROJECTS, pinsFile(), readPins(), terms, writePins()

### Community 6 - "npm Scripts"
Cohesion: 0.50
Nodes (4): scripts, dist, start, test

## Knowledge Gaps
- **3 isolated node(s):** `npm test Discovery Self-Check`, `Home View (composer, quick actions, recent sessions, project cards)`, `styles.css`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 43 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `build` connect `Installer Build Config` to `Package Dependencies`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **What connects `npm test Discovery Self-Check`, `Home View (composer, quick actions, recent sessions, project cards)`, `styles.css` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09113300492610837 - nodes in this community are weakly interconnected._
- **Why does `electron` connect `Package Dependencies` to `Electron Main Process`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `Installer Build Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Why does `@lydell/node-pty` connect `Package Dependencies` to `Electron Main Process`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._