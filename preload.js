const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deck', {
  platform: process.platform,
  projects: () => ipcRenderer.invoke('projects'),
  sessions: dir => ipcRenderer.invoke('sessions', dir),
  recent: () => ipcRenderer.invoke('recent'),
  report: dir => ipcRenderer.invoke('report', dir),
  openFolder: dir => ipcRenderer.invoke('open-folder', dir),
  pickFolder: () => ipcRenderer.invoke('pin:pick'),
  pickTarget: () => ipcRenderer.invoke('pick-target'),
  unpin: dir => ipcRenderer.invoke('pin:remove', dir),
  readClip: () => ipcRenderer.invoke('clip:read'),
  writeClip: t => ipcRenderer.invoke('clip:write', t),
  spawn: opts => ipcRenderer.invoke('pty:spawn', opts),
  write: (id, d) => ipcRenderer.send('pty:write', id, d),
  resize: (id, c, r) => ipcRenderer.send('pty:resize', id, c, r),
  kill: id => ipcRenderer.send('pty:kill', id),
  onData: cb => ipcRenderer.on('pty:data', (_, id, d) => cb(id, d)),
  onExit: cb => ipcRenderer.on('pty:exit', (_, id, code) => cb(id, code)),
});
