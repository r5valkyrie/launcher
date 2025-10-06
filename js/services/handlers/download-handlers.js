import { ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fetchChecksums, downloadAll, createCancelToken, cancelToken } from '../file-downloader.js';
import { getSetting, setSetting } from '../settings-store.js';

export let activeDownloadToken = null;
let downloadPaused = false;

/**
 * Registers download-related IPC handlers
 */
export function registerDownloadHandlers(mainWindow) {
  // Fetch checksums
  ipcMain.handle('download:checksums', async (_e, { baseUrl }) => {
    return fetchChecksums(baseUrl);
  });

  // Download all files
  ipcMain.handle('download:all', async (e, { baseUrl, checksums, installDir, includeOptional, concurrency, partConcurrency, channelName, mode }) => {
    const emit = (channel, payload) => e.sender.send(channel, payload);

    // Respect user mods.vdf during repair/update: skip replacing it if present
    try {
      const isInstall = String(mode || 'install').toLowerCase() === 'install';
      if (!isInstall) {
        const modsVdfPath = path.join(installDir, 'mods', 'mods.vdf');
        if (fs.existsSync(modsVdfPath)) {
          const files = Array.isArray(checksums?.files) ? checksums.files : [];
          const filtered = files.filter((f) => {
            try {
              const p = String(f?.path || f?.name || '').replace(/\\/g, '/').toLowerCase();
              return p !== 'mods/mods.vdf';
            } catch { return true; }
          });
          checksums = { ...(checksums || {}), files: filtered };
        }
      }
    } catch {}

    activeDownloadToken = createCancelToken();
    downloadPaused = false;

    try {
      await downloadAll(
        baseUrl,
        checksums,
        installDir,
        emit,
        Boolean(includeOptional),
        Number(concurrency) || 4,
        Number(partConcurrency) || 4,
        activeDownloadToken,
        () => downloadPaused
      );

      try {
        const channels = getSetting('channels', {}) || {};
        channels[String(channelName || 'default')] = {
          installDir,
          gameVersion: checksums?.game_version || null,
          gameBaseUrl: baseUrl,
          lastUpdatedAt: Date.now(),
        };
        setSetting('channels', channels);
      } catch (persistErr) {
        console.error('Failed to persist channel info', persistErr);
      }
    } finally {
      activeDownloadToken = null;
    }

    return true;
  });

  // Pause download
  ipcMain.handle('download:pause', async () => {
    downloadPaused = true;
    try { mainWindow?.webContents.send('progress:paused', {}); } catch {}
    return true;
  });

  // Resume download
  ipcMain.handle('download:resume', async () => {
    downloadPaused = false;
    try { mainWindow?.webContents.send('progress:resumed', {}); } catch {}
    return true;
  });

  // Cancel download
  ipcMain.handle('download:cancel', async () => {
    try { cancelToken(activeDownloadToken); } catch {}
    activeDownloadToken = null;
    downloadPaused = false;
    try { mainWindow?.webContents.send('progress:cancelled', {}); } catch {}
    return true;
  });
}
