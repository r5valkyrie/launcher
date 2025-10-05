import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getSetting, setSetting } from '../services/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Returns URL for dev server or file URL for built index.html
 */
export function getAppUrl() {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) return devUrl;
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  return pathToFileURL(indexPath).toString();
}

/**
 * Creates and configures the main application window
 */
export async function createWindow() {
  // Get saved window size or use defaults
  const savedWindowState = getSetting('windowState', {
    width: 1150,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false
  });

  const mainWindow = new BrowserWindow({
    width: savedWindowState.width,
    height: savedWindowState.height,
    x: savedWindowState.x,
    y: savedWindowState.y,
    minWidth: 1150,
    minHeight: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    await mainWindow.loadFile(indexPath);
  }

  // Open external links in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try { shell.openExternal(url); } catch {}
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isFile = url.startsWith('file:');
    const isDevLocal = !!process.env.VITE_DEV_SERVER_URL && url.startsWith(String(process.env.VITE_DEV_SERVER_URL));
    if (!isFile && !isDevLocal) {
      event.preventDefault();
      try { shell.openExternal(url); } catch {}
    }
  });

  const ensureShown = () => {
    if (!mainWindow) return;
    if (!mainWindow.isVisible()) mainWindow.show();
    if (!mainWindow.isFocused()) mainWindow.focus();
  };

  // Restore maximized state
  if (savedWindowState.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.once('ready-to-show', ensureShown);
  mainWindow.webContents.once('did-finish-load', ensureShown);
  const safetyShow = setTimeout(ensureShown, 1000);
  mainWindow.on('show', () => clearTimeout(safetyShow));

  // Save window state when it changes
  function saveWindowState() {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    const isMaximized = mainWindow.isMaximized();
    
    setSetting('windowState', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized
    });
  }

  // Save window state on resize, move, and maximize/unmaximize
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  const isDev = !!process.env.VITE_DEV_SERVER_URL || process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Basic diagnostics if load fails
  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc, validatedURL) => {
    console.error('Load failed', { errorCode, errorDesc, validatedURL });
    const { dialog } = require('electron');
    dialog.showErrorBox('Load failed', `${errorDesc} (code ${errorCode})\nURL: ${validatedURL}`);
    mainWindow.show();
  });

  return mainWindow;
}

/**
 * Sets up window control IPC handlers
 */
export function setupWindowIPC(ipcMain, getMainWindow) {
  ipcMain.on('window:minimize', () => { getMainWindow()?.minimize(); });
  ipcMain.on('window:maximize', () => { 
    const mainWindow = getMainWindow();
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window:close', () => { getMainWindow()?.close(); });
}
