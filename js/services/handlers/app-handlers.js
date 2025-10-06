import { app, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Registers app-related IPC handlers
 */
export function registerAppHandlers() {
  // App version
  ipcMain.handle('app:getVersion', async () => {
    try { return app.getVersion(); } catch { return '0.0.0'; }
  });

  // Base directory
  ipcMain.handle('app:getBaseDir', async () => {
    try {
      const baseDir = path.resolve(app.getAppPath(), '..');
      return baseDir;
    } catch {
      return '';
    }
  });

  // Launcher install root
  ipcMain.handle('app:getLauncherInstallRoot', async () => {
    try {
      const localAppData = process.env['LOCALAPPDATA'] || path.join(app.getPath('home'), 'AppData', 'Local');
      return path.join(localAppData, 'Programs', 'r5vlauncher');
    } catch {
      return '';
    }
  });

  // Default install directory
  ipcMain.handle('app:default-install-dir', (_e, { channelName }) => {
    let base = '';

    if (process.platform === "win32") {
      const localAppData = process.env['LOCALAPPDATA'] || path.join(app.getPath('home'), 'AppData', 'Local');
      base = path.join(localAppData, 'Programs', 'R5VLibrary');
    } else if (process.platform === "linux") {
      const gamesDir = path.join(app.getPath('home'), 'Games');
      base = path.join(gamesDir, 'R5VLibrary');
    }

    return channelName ? path.join(base, channelName) : base;
  });

  // File system check
  ipcMain.handle('app:is-installed-in-dir', async (_e, { path: targetPath }) => {
    let hasClient = false;
    let hasServer = false;
    try { await fs.promises.access(path.join(targetPath, 'r5apex.exe')); hasClient = true; } catch { }
    try { await fs.promises.access(path.join(targetPath, 'r5apex_ds.exe')); hasServer = true; } catch { }
    return hasClient || hasServer;
  });
}
