const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getBaseDir: () => ipcRenderer.invoke('app:getBaseDir'),
  getLauncherInstallRoot: () => ipcRenderer.invoke('app:getLauncherInstallRoot'),
  getDefaultInstallDir: (channelName) => ipcRenderer.invoke('app:default-install-dir', { channelName }),
  isInstalledInDir: (path) => ipcRenderer.invoke('app:is-installed-in-dir', { path }),
  openExternal: (url) => ipcRenderer.invoke('open-external', { url }),

  // Dialog
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  selectFile: (filters) => ipcRenderer.invoke('dialog:select-file', { filters }),

  // Download
  fetchChecksums: (baseUrl) => ipcRenderer.invoke('download:checksums', { baseUrl }),
  downloadAll: (args) => ipcRenderer.invoke('download:all', args),
  pauseDownload: () => ipcRenderer.invoke('download:pause'),
  resumeDownload: () => ipcRenderer.invoke('download:resume'),
  cancelDownload: () => ipcRenderer.invoke('download:cancel'),
  onProgress: (channel, listener) => ipcRenderer.on(channel, (_e, payload) => listener(payload)),

  // Game
  launchGame: (payload) => ipcRenderer.invoke('game:launch', payload),
  listProtonVersions: () => ipcRenderer.invoke('game:listProtonVersions'),

  // Mods
  listInstalledMods: (installDir) => ipcRenderer.invoke('mods:listInstalled', { installDir }),
  setModEnabled: (installDir, name, enabled) => ipcRenderer.invoke('mods:setEnabled', { installDir, name, enabled }),
  reorderMods: (installDir, orderIds) => ipcRenderer.invoke('mods:reorder', { installDir, orderIds }),
  uninstallMod: (installDir, folder) => ipcRenderer.invoke('mods:uninstall', { installDir, folder }),
  fetchAllMods: (query) => ipcRenderer.invoke('mods:fetchAll', { query }),
  installMod: (installDir, name, downloadUrl) => ipcRenderer.invoke('mods:install', { installDir, name, downloadUrl }),
  getModIconDataUrl: (installDir, folder) => ipcRenderer.invoke('mods:iconDataUrl', { installDir, folder }),
  watchMods: (installDir) => ipcRenderer.invoke('mods:watch', { installDir }),
  unwatchMods: (installDir) => ipcRenderer.invoke('mods:unwatch', { installDir }),
  onModsProgress: (listener) => ipcRenderer.on('mods:progress', (_e, payload) => listener(payload)),
  onModsChanged: (listener) => ipcRenderer.on('mods:changed', (_e, payload) => listener(payload)),

  // Network
  fetchLauncherConfig: (url) => ipcRenderer.invoke('network:getLauncherConfig', { url }),
  fetchEula: () => ipcRenderer.invoke('network:getEula'),

  // Permissions
  fixFolderPermissions: (payload) => ipcRenderer.invoke('permissions:fix-folder-permissions', payload),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),

  // Update
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  quitAndInstall: () => ipcRenderer.invoke('update:quitAndInstall'),
  onUpdate: (channel, listener) => ipcRenderer.on(channel, (_e, payload) => listener(payload)),

  // Video
  cacheBackgroundVideo: (filename) => ipcRenderer.invoke('video:cache', { filename }),

  // Window
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
