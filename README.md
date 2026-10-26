# Claude Deck

A desktop app for Claude Code that runs on Windows and Linux. It lists every project on your machine and lets you start or resume Claude sessions in real terminal tabs. If a project has a graphify graph and report, you can open them inside the app too.

Projects come from four places: folders you've run Claude Code in (`~/.claude/projects`), git repos and `graphify-out/` folders up to 3 levels below your home folder, and any folders you add with **+**.

## REA

**Set up REA** on the home screen runs `npx rea-agents setup` in a terminal tab, which installs [REA](https://github.com/morluto/rea) (Reverse Engineer Anything) for Claude Code. On a project, **Reverse engineer…** asks you to pick an app or binary, then starts a Claude session in that project that uses REA on it.

## Usage and updates

The bars at the bottom of the sidebar show your Claude plan usage: the 5-hour session window and the week, with when each resets. They use Claude Code's login, so sign in to Claude Code first. They refresh every 5 minutes and when you click **Refresh**.

**Updates** checks this repo's GitHub Releases for a newer version, downloads it with a progress bar, installs it and restarts. The repo is private, so it signs in with your GitHub CLI login (`gh auth login`); no token is stored in the app. Installed copies don't need the source code or any build tools.

## New and changed projects on GitHub

When Claude Deck opens, it asks the GitHub CLI (`gh`, signed in with `gh auth login`) for your repositories and fetches every local GitHub repo. If a repository isn't on this computer yet, it offers to clone it into your home folder; if a local copy is behind GitHub, it offers to pull it (fast-forward only, so local changes are never overwritten). `~/claude-deck` itself is left to **Updates**. **Don't ask again** stops it offering those ones. Without `gh` it skips the new-repository check.

## Versions

The version next to the name is `major.minor` from `package.json` plus the number of commits, so every push to GitHub builds as a new version. Change `major.minor` in `package.json` by hand when you want a bigger jump.

## Run

```
npm install
npm start
```

## Release a new version

```
npm run release
```

Run it on the Linux PC from a clean `main`. It pushes `main`, builds the Linux AppImage here and the Windows installer in the Win11 VM on Proxmox, and publishes both to the GitHub Release `v<version>`. Every installed copy then sees the update.

What it needs:

- `gh` signed in, and `ssh pve` reaching the Proxmox host as root.
- VM 111 with the QEMU guest agent running.
- Portable Node and MinGit unpacked in the VM's `C:\build`.

Override the defaults with `PVE`, `VMID`, `PVE_IP`, `PORT`, `WIN_NODE` and `WIN_GIT`.

The Windows installer (`Claude-Deck-Setup-<version>.exe`) installs on any 64-bit Windows 10 or 11 PC without Node or Git. It isn't code-signed, so the first install shows SmartScreen's "Windows protected your PC": choose **More info → Run anyway**.

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
