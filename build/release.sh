#!/usr/bin/env bash
# npm run release: builds the Linux AppImage here and the Windows installer in the Win11 VM on Proxmox,
# then publishes both to the GitHub Release v<version> that the in-app Updates button installs from.
# Needs: gh signed in, `ssh $PVE` as root on the Proxmox host, and in the VM the QEMU guest agent plus
# portable Node and MinGit under C:\build (see README).
set -euo pipefail
PVE=${PVE:-pve} VMID=${VMID:-111} PVE_IP=${PVE_IP:-192.168.0.12} PORT=${PORT:-8766}
WIN_NODE=${WIN_NODE:-'C:\build\node-v24.22.1-win-x64'} WIN_GIT=${WIN_GIT:-'C:\build\git\cmd'}

cd "$(dirname "$0")/.."
[ "$(git branch --show-current)" = main ] || { echo "Release from main."; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Commit your changes first."; exit 1; }
git push -q origin main
ver=$(node -p "require('./build/version')('.')")
gh release view "v$ver" >/dev/null 2>&1 && { echo "v$ver is already released."; exit 1; }
echo "Releasing $ver"

work=$(mktemp -d)
cleanup() {
  ssh "$PVE" '[ -f /tmp/deck-release/pid ] && kill "$(cat /tmp/deck-release/pid)" 2>/dev/null; rm -rf /tmp/deck-release' || true
  rm -rf "$work"
}
trap cleanup EXIT

# Proxmox host: serves the code to the VM and takes the installer back (the VM can't reach this PC or GitHub's private repo)
git bundle create "$work/deck.bundle" main 2>/dev/null
ssh "$PVE" 'rm -rf /tmp/deck-release && mkdir -p /tmp/deck-release/out'
scp -q "$work/deck.bundle" "$PVE:/tmp/deck-release/deck.bundle"
ssh "$PVE" "cat > /tmp/deck-release/serve.py" <<'EOF'
import http.server, os
os.chdir('/tmp/deck-release')
class H(http.server.SimpleHTTPRequestHandler):
    def do_PUT(self):
        n = int(self.headers['Content-Length'])
        with open(os.path.join('out', os.path.basename(self.path)), 'wb') as f:
            while n > 0:
                b = self.rfile.read(min(n, 1 << 20)); f.write(b); n -= len(b)
        self.send_response(201); self.end_headers()
    def log_message(self, *a): pass
http.server.HTTPServer((os.environ['IP'], int(os.environ['PORT'])), H).serve_forever()
EOF
ssh "$PVE" "cd /tmp/deck-release && (IP=$PVE_IP PORT=$PORT timeout 3600 python3 serve.py >/dev/null 2>&1 & echo \$! > pid)"

ssh "$PVE" "qm status $VMID | grep -q running || qm start $VMID"
for i in $(seq 60); do ssh "$PVE" "qm agent $VMID ping" 2>/dev/null && break; [ "$i" = 60 ] && { echo "VM $VMID guest agent not answering."; exit 1; }; sleep 5; done

url="http://$PVE_IP:$PORT"
sed 's/$/\r/' > "$work/release.cmd" <<EOF
@echo off
set PATH=$WIN_NODE;$WIN_GIT;%PATH%
cd /d C:\\build || exit /b 1
curl.exe -sSfo deck.bundle $url/deck.bundle || exit /b 2
if not exist claude-deck git clone -q deck.bundle claude-deck || exit /b 3
cd claude-deck
git fetch -q ..\\deck.bundle main && git reset -q --hard FETCH_HEAD || exit /b 4
call npm install --no-audit --no-fund || exit /b 5
call npm test || exit /b 6
call npm run dist -- --win nsis || exit /b 7
for %%f in (dist\\Inarch-Setup-*.exe dist\\Inarch-Setup-*.exe.blockmap dist\\latest.yml) do curl.exe -sSf -T "%%f" $url/%%~nxf || exit /b 8
del ..\\deck.bundle
EOF
scp -q "$work/release.cmd" "$PVE:/tmp/deck-release/release.cmd"
pid=$(ssh "$PVE" "pvesh create /nodes/\$(hostname)/qemu/$VMID/agent/file-write --file C:/deck-release.cmd --content \"\$(cat /tmp/deck-release/release.cmd)\" >/dev/null &&
  qm guest exec $VMID --timeout 1 -- cmd /c C:/deck-release.cmd 2>/dev/null" | python3 -c 'import json,sys; print(json.load(sys.stdin)["pid"])')
echo "Windows build running in VM $VMID; building Linux here meanwhile"

npm run dist -- --linux AppImage >"$work/linux.log" 2>&1 || { tail -20 "$work/linux.log"; exit 1; }

while :; do
  st=$(ssh "$PVE" "qm guest exec-status $VMID $pid")
  if python3 -c 'import json,sys; sys.exit(0 if json.loads(sys.argv[1]).get("exited") else 1)' "$st"; then break; fi
  sleep 10
done
ssh "$PVE" "qm guest exec $VMID --timeout 30 -- cmd /c del C:\\\\deck-release.cmd" >/dev/null || true
code=$(python3 -c 'import json,sys; d=json.loads(sys.argv[1]); print(d.get("exitcode", 1))' "$st")
if [ "$code" != 0 ]; then
  echo "Windows build failed (exit $code):"
  python3 -c 'import json,sys; d=json.loads(sys.argv[1]); print((d.get("out-data","") + d.get("err-data",""))[-3000:])' "$st"
  exit 1
fi

mkdir -p dist/win
scp -q "$PVE:/tmp/deck-release/out/*" dist/win/
grep -q "^version: $ver$" dist/win/latest.yml || { echo "Windows build isn't $ver:"; cat dist/win/latest.yml; exit 1; }
grep -q "^version: $ver$" dist/latest-linux.yml || { echo "Linux build isn't $ver"; exit 1; }

prev=$(git describe --tags --abbrev=0 2>/dev/null || true)
notes=$(git log --format='- %s' ${prev:+"$prev"..}HEAD)
gh release create "v$ver" --target "$(git rev-parse HEAD)" --title "Inarch $ver" --notes "$notes" \
  "dist/Inarch-$ver.AppImage" dist/latest-linux.yml \
  "dist/win/Inarch-Setup-$ver.exe" "dist/win/Inarch-Setup-$ver.exe.blockmap" dist/win/latest.yml
git fetch -q --tags
echo "Released v$ver"
