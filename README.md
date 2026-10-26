# Claude Deck

A desktop app for Claude Code that runs on Windows and Linux. It lists every project on your machine and lets you start or resume Claude sessions in real terminal tabs. If a project has a graphify graph and report, you can open them inside the app too.

Projects come from four places: folders you've run Claude Code in (`~/.claude/projects`), git repos and `graphify-out/` folders up to 3 levels below your home folder, and any folders you add with **+**.

## REA

**Set up REA** on the home screen runs `npx rea-agents setup` in a terminal tab, which installs [REA](https://github.com/morluto/rea) (Reverse Engineer Anything) for Claude Code. On a project, **Reverse engineer…** asks you to pick an app or binary, then starts a Claude session in that project that uses REA on it.

## Usage and updates

The bars at the bottom of the sidebar show your Claude plan usage: the 5-hour session window and the week, with when each resets. They use Claude Code's login, so sign in to Claude Code first. They refresh every 5 minutes and when you click **Refresh**.

**Updates** checks GitHub for changes newer than the build you're running. If there are any, it pulls them into `~/claude-deck`, rebuilds, replaces the installed AppImage (on Windows it opens the new installer) and restarts.

## Run

```
npm install
npm start
```

## Build an installer

Build on the operating system you're targeting, because the terminal library includes a native module for each platform.

```
npm run dist        # Windows: dist/Claude Deck Setup 1.0.0.exe + portable exe
                    # Linux:   dist/*.AppImage + dist/*.deb
```

## Shortcuts

| Keys | Action |
|---|---|
| Ctrl+Shift+T | New session |
| Ctrl+Shift+W | Close the current terminal tab |
| Ctrl+Tab / Ctrl+Shift+Tab | Switch terminal tabs |
| Ctrl+Shift+F | Find in the current terminal (Enter / Shift+Enter for next / previous, Esc to close) |
| Ctrl+Shift+C | Copy the selection |
| Ctrl+V | Paste |
| Right-click | Copy the selection, or paste if nothing is selected |

`npm test` runs the self-check for project and session discovery.
