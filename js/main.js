import { app, BrowserWindow } from 'electron';
// Import service modules
import { createWindow } from './services/window-manager.js';
import { setupDeeplinkHandling, registerProtocolClient, extractDeeplinks, queueDeeplink, flushDeeplinks } from './services/deeplink-handler.js';
import { setupAutoUpdater } from './services/auto-updater.js';
import { registerGeneralHandlers } from './services/register-ipc-handlers.js';
import { activeDownloadToken } from './services/handlers/download-handlers.js';
import { cancelToken } from './services/file-downloader.js';

let mainWindow;

// Set up deeplink handling early (before app.whenReady)
const shouldQuit = !setupDeeplinkHandling(() => mainWindow);
if (shouldQuit) {
  // setupDeeplinkHandling returns false if we didn't get instance lock
  process.exit(0);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(async () => {
  // Register the OS protocol client so r5v:// links open the app
  registerProtocolClient();

  // Register protocol handlers BEFORE creating window
  // This must happen before loadFile/loadURL is called
  const { registerProtocolHandlers } = await import('./services/handlers/protocol-handlers.js');
  registerProtocolHandlers();

  // Create the main window
  mainWindow = await createWindow();

  // Set up auto-updater
  setupAutoUpdater(mainWindow);

  // Register all IPC handlers
  registerGeneralHandlers(mainWindow);

  // Queue any deeplinks passed on first launch (Windows)
  try { extractDeeplinks(process.argv).forEach((link) => queueDeeplink(link)); } catch {}

  // Flush queued deeplinks when renderer is ready
  try { mainWindow?.webContents?.once('did-finish-load', () => flushDeeplinks(mainWindow)); } catch {}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().then(win => { mainWindow = win; });
    }
  });
});

app.on('before-quit', () => {
  if (activeDownloadToken) {
    try { cancelToken(activeDownloadToken); } catch {}
  }
});
