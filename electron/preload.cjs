const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),
  fetchChecksums: (baseUrl) => ipcRenderer.invoke('download:checksums', { baseUrl }),
  downloadAll: (args) => ipcRenderer.invoke('download:all', args),
  onProgress: (channel, listener) => ipcRenderer.on(channel, (_e, payload) => listener(payload)),
  getDefaultInstallDir: (channelName) => ipcRenderer.invoke('default-install-dir', { channelName }),
  fetchLauncherConfig: (url) => ipcRenderer.invoke('launcher:config', { url }),
  cacheBackgroundVideo: (filename) => ipcRenderer.invoke('video:cache', { filename }),
  exists: (path) => ipcRenderer.invoke('fs:exists', { path }),
  openPath: (path) => ipcRenderer.invoke('path:open', { path }),
  openExternal: (url) => ipcRenderer.invoke('open-external', { url }),
  cancelDownload: () => ipcRenderer.invoke('download:cancel'),
  selectFile: (filters) => ipcRenderer.invoke('select-file', { filters }),
  launchGame: (payload) => ipcRenderer.invoke('game:launch', payload),
  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  quitAndInstall: () => ipcRenderer.invoke('update:quitAndInstall'),
  onUpdate: (channel, listener) => ipcRenderer.on(channel, (_e, payload) => listener(payload)),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});


