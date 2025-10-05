import { app, BrowserWindow, ipcMain } from 'electron';

// Module imports
import { createWindow, setupWindowIPC } from './modules/window.js';
import { 
  setupDeeplinkHandling, 
  registerProtocolClient, 
  queueInitialDeeplinks, 
  flushDeeplinks 
} from './modules/deeplinks.js';
import { setupAutoUpdater, setupUpdateIPC } from './modules/updater.js';
import { setupModsIPC } from './modules/mods.js';
import { setupDownloadIPC, cancelActiveDownloads } from './modules/downloads.js';
import { setupGameIPC } from './modules/game.js';
import { setupPermissionsIPC } from './modules/permissions.js';
import { registerCacheProtocol, interceptFileProtocol } from './modules/protocols.js';
import { setupBasicIPC } from './modules/ipc-handlers.js';

// Main window reference
let mainWindow;

/**
 * Returns the main window instance
 */
function getMainWindow() {
  return mainWindow;
}

// Setup deeplink handling (must be called before app.whenReady)
const hasInstanceLock = setupDeeplinkHandling(getMainWindow);
if (!hasInstanceLock) {
  // App will quit if we don't have the instance lock
  process.exit(0);
}

// App lifecycle handlers
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(async () => {
  // Register protocol handlers
  registerProtocolClient();
  registerCacheProtocol();
  interceptFileProtocol();

  // Create main window
  mainWindow = await createWindow();

  // Setup auto-updater
  setupAutoUpdater(getMainWindow);

  // Queue any deeplinks passed on first launch (Windows)
  queueInitialDeeplinks();

  // Flush queued deeplinks when renderer is ready
  try { 
    mainWindow?.webContents?.once('did-finish-load', () => flushDeeplinks(getMainWindow)); 
  } catch {}

  // Handle macOS activation
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().then((win) => {
        mainWindow = win;
      });
    }
  });
});

// Setup all IPC handlers
setupUpdateIPC(ipcMain);
setupBasicIPC(ipcMain);
setupModsIPC(ipcMain, getMainWindow);
setupDownloadIPC(ipcMain, getMainWindow);
setupGameIPC(ipcMain);
setupPermissionsIPC(ipcMain);
setupWindowIPC(ipcMain, getMainWindow);

// Cleanup before quit
app.on('before-quit', () => {
  cancelActiveDownloads();
});