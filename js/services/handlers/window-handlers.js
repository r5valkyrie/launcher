import { ipcMain } from 'electron';
import { getAllSettings, setSetting } from '../settings-store.js';

/**
 * Registers window control IPC handlers
 */
export function registerWindowHandlers(mainWindow) {
  // Settings
  ipcMain.handle('settings:get', () => getAllSettings());
  ipcMain.handle('settings:set', (_e, { key, value }) => setSetting(key, value));

  // Window controls
  ipcMain.on('window:minimize', () => { mainWindow?.minimize(); });
  ipcMain.on('window:maximize', () => { if (!mainWindow) return; if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
  ipcMain.on('window:close', () => { mainWindow?.close(); });
}
