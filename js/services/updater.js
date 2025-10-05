import { createRequire } from 'node:module';
import { ipcMain } from 'electron';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

/**
 * Sets up auto-updater with the main window
 */
export function setupAutoUpdater(mainWindow) {
  try {
    autoUpdater.autoDownload = false;
    try { autoUpdater.logger = log; log.transports.file.level = 'info'; } catch {}

    autoUpdater.on('error', (err) => {
      try { mainWindow?.webContents.send('update:error', { message: String(err?.stack || err?.message || err) }); } catch {}
    });

    autoUpdater.on('update-available', (info) => {
      try { mainWindow?.webContents.send('update:available', info); } catch {}
    });

    autoUpdater.on('update-not-available', (info) => {
      try { mainWindow?.webContents.send('update:not-available', info); } catch {}
    });

    autoUpdater.on('download-progress', (p) => {
      try { mainWindow?.webContents.send('update:download-progress', p); } catch {}
    });

    autoUpdater.on('update-downloaded', (info) => {
      try { mainWindow?.webContents.send('update:downloaded', info); } catch {}
    });
  } catch {}
}

/**
 * Registers IPC handlers for auto-updater
 */
export function registerUpdaterHandlers() {
  ipcMain.handle('update:check', async () => {
    try { const res = await autoUpdater.checkForUpdates(); return { ok: true, result: res?.updateInfo || null }; } catch (e) { return { ok: false, error: String(e?.message || e) }; }
  });

  ipcMain.handle('update:download', async () => {
    try { await autoUpdater.downloadUpdate(); return { ok: true }; } catch (e) { return { ok: false, error: String(e?.message || e) }; }
  });

  ipcMain.handle('update:quitAndInstall', async () => {
    try { setImmediate(() => autoUpdater.quitAndInstall(false, true)); return { ok: true }; } catch (e) { return { ok: false, error: String(e?.message || e) }; }
  });
}
