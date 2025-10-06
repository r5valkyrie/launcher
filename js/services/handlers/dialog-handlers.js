import { ipcMain, dialog } from 'electron';

/**
 * Registers dialog-related IPC handlers
 */
export function registerDialogHandlers() {
  // Directory selection
  ipcMain.handle('dialog:select-directory', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  // File selection
  ipcMain.handle('dialog:select-file', async (_e, { filters }) => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: Array.isArray(filters) ? filters : undefined,
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });
}
