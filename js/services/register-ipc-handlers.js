// Main IPC handlers orchestrator - imports and registers all handler modules
import { registerAppHandlers } from './handlers/app-handlers.js';
import { registerDialogHandlers } from './handlers/dialog-handlers.js';
import { registerDownloadHandlers } from './handlers/download-handlers.js';
import { registerGameHandlers } from './handlers/game-handlers.js';
import { registerModHandlers } from './handlers/mods-handlers.js';
import { registerNetworkHandlers } from './handlers/network-handlers.js';
import { registerProtocolHandlers } from './handlers/protocol-handlers.js';
import { registerUpdaterHandlers } from './handlers/updater-handlers.js';
import { registerVideoHandlers } from './handlers/video-handlers.js';
import { registerPermissionsHandlers } from './handlers/permissions-handlers.js';
import { registerWindowHandlers } from './handlers/window-handlers.js';

/**
 * Registers all general-purpose IPC handlers
 */
export function registerGeneralHandlers(mainWindow) {
  registerAppHandlers();
  registerDialogHandlers();
  registerDownloadHandlers(mainWindow);
  registerGameHandlers();
  registerModHandlers(mainWindow);
  registerNetworkHandlers();
  registerProtocolHandlers();
  registerUpdaterHandlers();
  registerVideoHandlers();
  registerPermissionsHandlers();
  registerWindowHandlers(mainWindow);
}
