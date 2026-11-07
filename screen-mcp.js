// Stdio MCP server giving Claude sessions a read-only screenshot of the desktop. Inarch runs it with its own
// Electron binary in Node mode (ELECTRON_RUN_AS_NODE), so it needs no Node install. No mouse or keyboard control.
const { execFile } = require('child_process');

// shortcut: one image of all monitors, long edge capped at 2560px; add a per-monitor option if text gets too small
const MAX = 2560;

// GNOME/KDE on Wayland or X11: the desktop portal's non-interactive screenshot (no dialog for host apps)
const LINUX = `
import sys, os, base64
import gi
gi.require_version('Gio', '2.0'); gi.require_version('GdkPixbuf', '2.0')
from gi.repository import Gio, GLib, GdkPixbuf
bus = Gio.bus_get_sync(Gio.BusType.SESSION)
loop = GLib.MainLoop(); out = {}
def on(conn, sender, path, iface, sig, params):
    out['code'], res = params.unpack(); out['uri'] = res.get('uri'); loop.quit()
token = 'inarch%d' % GLib.random_int()
req = '/org/freedesktop/portal/desktop/request/%s/%s' % (bus.get_unique_name()[1:].replace('.', '_'), token)
bus.signal_subscribe('org.freedesktop.portal.Desktop', 'org.freedesktop.portal.Request', 'Response', req, None, 0, on)
bus.call_sync('org.freedesktop.portal.Desktop', '/org/freedesktop/portal/desktop', 'org.freedesktop.portal.Screenshot', 'Screenshot',
  GLib.Variant('(sa{sv})', ('', {'handle_token': GLib.Variant('s', token), 'interactive': GLib.Variant('b', False)})), None, 0, -1, None)
GLib.timeout_add_seconds(30, loop.quit); loop.run()
if out.get('code') != 0 or not out.get('uri'): sys.exit('The screenshot portal refused or timed out (code %s)' % out.get('code'))
f = Gio.File.new_for_uri(out['uri']).get_path()
pb = GdkPixbuf.Pixbuf.new_from_file(f); os.remove(f)  # the portal saves into ~/Pictures; don't leave it there
w, h = pb.get_width(), pb.get_height(); s = min(1, ${MAX} / max(w, h))
if s < 1: pb = pb.scale_simple(int(w * s), int(h * s), GdkPixbuf.InterpType.BILINEAR)
if pb.get_has_alpha():  # the portal's PNG is RGBA, which gdk-pixbuf saves as a grayscale JPEG: drop the alpha bytes
    w, h, rs = pb.get_width(), pb.get_height(), pb.get_rowstride()
    px = pb.get_pixels(); data = bytearray()
    for y in range(h): row = bytearray(px[y * rs:y * rs + w * 4]); del row[3::4]; data += row
    pb = GdkPixbuf.Pixbuf.new_from_bytes(GLib.Bytes.new(bytes(data)), GdkPixbuf.Colorspace.RGB, False, 8, w, h, w * 3)
ok, buf = pb.save_to_bufferv('jpeg', ['quality'], ['80'])
sys.stdout.write(base64.b64encode(buf).decode())
`;

// whole virtual screen; DPI-aware so scaled displays aren't cropped
const WIN = `
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();' -Name U -Namespace W
[W.U]::SetProcessDPIAware() | Out-Null
$b = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
[System.Drawing.Graphics]::FromImage($bmp).CopyFromScreen($b.Left, $b.Top, 0, 0, $bmp.Size)
$s = [Math]::Min(1, ${MAX} / [Math]::Max($b.Width, $b.Height))
$out = New-Object System.Drawing.Bitmap $bmp, ([int]($b.Width * $s)), ([int]($b.Height * $s))
$ms = New-Object System.IO.MemoryStream
$out.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
[Convert]::ToBase64String($ms.ToArray())
`;

const capture = () => new Promise((resolve, reject) => {
  const [cmd, args] = process.platform === 'win32'
    ? ['powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', WIN]]
    : ['python3', ['-c', LINUX]];
  execFile(cmd, args, { maxBuffer: 64 << 20, timeout: 45000, windowsHide: true }, (err, stdout, stderr) =>
    err ? reject(new Error((stderr || err.message).trim())) : resolve(stdout.trim()));
});

const TOOLS = [{
  name: 'screenshot',
  description: "Take a screenshot of the user's whole desktop (all monitors) to see what is on screen. Read-only. Only works when the user's latest message contains the word \"look\"; don't call it otherwise.",
  inputSchema: { type: 'object', properties: {} },
}];

async function handle({ method, params }) {
  if (method === 'initialize') return { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'inarch-screen', version: '1.0.0' } };
  if (method === 'ping') return {};
  if (method === 'tools/list') return { tools: TOOLS };
  if (method === 'tools/call') {
    if (params?.name !== 'screenshot') throw Object.assign(new Error(`Unknown tool: ${params?.name}`), { code: -32602 });
    try { return { content: [{ type: 'image', data: await capture(), mimeType: 'image/jpeg' }] }; }
    catch (e) { return { isError: true, content: [{ type: 'text', text: `Screenshot failed: ${e.message}` }] }; }
  }
  throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
}

// The user's latest typed message in a session transcript (skips tool results and <command> wrappers)
function lastPrompt(text) {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].includes('"type":"user"')) continue;
    try {
      const c = JSON.parse(lines[i]).message?.content;
      const t = typeof c === 'string' ? c : Array.isArray(c) ? c.find(x => x.type === 'text')?.text : null;
      if (t && !t.trimStart().startsWith('<')) return t;
    } catch { /* partial line */ }
  }
  return '';
}
const saysLook = text => /\blook\b/i.test(lastPrompt(text));

const send = m => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');

// PreToolUse hook mode: allow the screenshot only when the user's latest message contains the word "look"
if (require.main === module && process.argv.includes('--gate')) {
  let input = '';
  process.stdin.on('data', d => { input += d; }).on('end', () => {
    let ok = false;
    try { ok = saysLook(require('fs').readFileSync(JSON.parse(input).transcript_path, 'utf8')); } catch { /* fail closed */ }
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: ok ? 'allow' : 'deny',
      permissionDecisionReason: ok ? 'The user said "look".' : 'Screenshots only run when the user\'s message contains the word "look". Ask them to say "look" if you need to see the screen.' } }));
  });
}
module.exports = { saysLook };
if (require.main === module && !process.argv.includes('--gate')) {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { send({ id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
      if (msg.id === undefined) continue; // notifications need no reply
      handle(msg).then(result => send({ id: msg.id, result }), e => send({ id: msg.id, error: { code: e.code || -32603, message: e.message } }));
    }
  });
}
