import { app, BrowserWindow } from 'electron';
// Import service modules
import { createWindow } from './services/window.js';
import { setupDeeplinkHandling, registerProtocolClient, extractDeeplinks, queueDeeplink, flushDeeplinks } from './services/deeplink.js';
import { setupAutoUpdater, registerUpdaterHandlers } from './services/updater.js';
import { registerModHandlers } from './services/mods.js';
import { registerGameHandlers } from './services/game.js';
import { registerGeneralHandlers, cleanupBeforeQuit } from './services/ipc-handlers.js';
import { registerProtocolHandlers } from './services/protocol.js';

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

  // Register custom protocol handlers
  registerProtocolHandlers();

  // Create the main window
  mainWindow = await createWindow();

  // Set up auto-updater
  setupAutoUpdater(mainWindow);

  // Register all IPC handlers
  registerUpdaterHandlers();
  registerModHandlers(mainWindow);
  registerGameHandlers();
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
  cleanupBeforeQuit();
});
