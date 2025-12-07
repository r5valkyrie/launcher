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
  scanCustomChannels: (officialChannelNames, channelsSettings) => ipcRenderer.invoke('scan-custom-channels', { officialChannelNames, channelsSettings }),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', { folderPath }),
  setDownloadSpeedLimit: (bytesPerSecond) => ipcRenderer.invoke('set-download-speed-limit', { bytesPerSecond }),
  cacheBackgroundVideo: (filename) => ipcRenderer.invoke('video:cache', { filename }),
  isInstalledInDir: (path) => ipcRenderer.invoke('fs:is-installed-in-dir', { path }),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', { filePath }),
  listDir: (dirPath) => ipcRenderer.invoke('fs:list-dir', { dirPath }),
  openExternal: (url) => ipcRenderer.invoke('open-external', { url }),
  pauseDownload: () => ipcRenderer.invoke('download:pause'),
  resumeDownload: () => ipcRenderer.invoke('download:resume'),
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
  fetchServers: () => ipcRenderer.invoke('servers:fetch'),
  installMod: (installDir, name, downloadUrl) => ipcRenderer.invoke('mods:install', { installDir, name, downloadUrl }),
  onModsProgress: (listener) => ipcRenderer.on('mods:progress', (_e, payload) => listener(payload)),
  getModIconDataUrl: (installDir, folder) => ipcRenderer.invoke('mods:iconDataUrl', { installDir, folder }),
  watchMods: (installDir) => ipcRenderer.invoke('mods:watch', { installDir }),
  unwatchMods: (installDir) => ipcRenderer.invoke('mods:unwatch', { installDir }),
  onModsChanged: (listener) => ipcRenderer.on('mods:changed', (_e, payload) => listener(payload)),
  // Thunderstore Profile API
  thunderstoreUploadProfile: (payload) => ipcRenderer.invoke('thunderstore:uploadProfile', { payload }),
  thunderstoreDownloadProfile: (code) => ipcRenderer.invoke('thunderstore:downloadProfile', { code }),
  // Permissions
  fixFolderPermissions: (payload) => ipcRenderer.invoke('fix-folder-permissions', payload),
  // Uninstall
  deleteFolder: (folderPath) => ipcRenderer.invoke('fs:delete-folder', { folderPath }),
});

// Expose limited ipcRenderer for event listeners
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel, listener) => {
      // Whitelist channels for security
      const validChannels = [
        'update:available',
        'update:not-available',
        'update:download-progress',
        'update:downloaded',
        'update:error'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, listener);
      }
    },
    removeListener: (channel, listener) => {
      ipcRenderer.removeListener(channel, listener);
    }
  }
});

