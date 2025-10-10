import { createRequire } from 'node:module';
import { ipcMain } from 'electron';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

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
