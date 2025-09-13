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
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getBaseDir: () => ipcRenderer.invoke('app:getBaseDir'),
  getLauncherInstallRoot: () => ipcRenderer.invoke('app:getLauncherInstallRoot'),
  fetchEula: () => ipcRenderer.invoke('eula:get'),
  onUpdate: (channel, listener) => ipcRenderer.on(channel, (_e, payload) => listener(payload)),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  // Mods
  listInstalledMods: (installDir) => ipcRenderer.invoke('mods:listInstalled', { installDir }),
  setModEnabled: (installDir, name, enabled) => ipcRenderer.invoke('mods:setEnabled', { installDir, name, enabled }),
  reorderMods: (installDir, orderIds) => ipcRenderer.invoke('mods:reorder', { installDir, orderIds }),
  uninstallMod: (installDir, folder) => ipcRenderer.invoke('mods:uninstall', { installDir, folder }),
  fetchAllMods: (query) => ipcRenderer.invoke('mods:fetchAll', { query }),
  installMod: (installDir, name, downloadUrl) => ipcRenderer.invoke('mods:install', { installDir, name, downloadUrl }),
  onModsProgress: (listener) => ipcRenderer.on('mods:progress', (_e, payload) => listener(payload)),
  getModIconDataUrl: (installDir, folder) => ipcRenderer.invoke('mods:iconDataUrl', { installDir, folder }),
  watchMods: (installDir) => ipcRenderer.invoke('mods:watch', { installDir }),
  unwatchMods: (installDir) => ipcRenderer.invoke('mods:unwatch', { installDir }),
  onModsChanged: (listener) => ipcRenderer.on('mods:changed', (_e, payload) => listener(payload)),
  // Permissions
  fixFolderPermissions: (payload) => ipcRenderer.invoke('fix-folder-permissions', payload),
});


