# Claude Deck

A desktop app for Claude Code that runs on Windows and Linux. It lists every project on your machine and lets you start or resume Claude sessions in real terminal tabs. If a project has a graphify graph and report, you can open them inside the app too.

Projects come from four places: folders you've run Claude Code in (`~/.claude/projects`), git repos and `graphify-out/` folders up to 3 levels below your home folder, and any folders you add with **+**.

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
