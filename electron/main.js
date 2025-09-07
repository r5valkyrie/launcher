import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import https from 'node:https';
import fs from 'node:fs';
// Preload is CommonJS to avoid ESM named export issues
import { fetchChecksums, downloadAll, createCancelToken, cancelToken } from './services/downloader.js';
import { getSetting, setSetting, getAllSettings } from './services/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Returns URL for dev server or file URL for built index.html
 */
function getAppUrl() {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) return devUrl;
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  return pathToFileURL(indexPath).toString();
}

let mainWindow;
let activeDownloadToken = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    await mainWindow.loadFile(indexPath);
  }
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open DevTools even in production to debug blank window
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  // Basic diagnostics if load fails
  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc, validatedURL) => {
    console.error('Load failed', { errorCode, errorDesc, validatedURL });
    dialog.showErrorBox('Load failed', `${errorDesc} (code ${errorCode})\nURL: ${validatedURL}`);
    mainWindow.show();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  // Register custom protocol to serve cached files from launcher dir
  const baseDir = path.resolve(app.getAppPath(), '..');
  const cacheRoot = path.join(baseDir, 'cache');
  protocol.registerFileProtocol('r5v', (request, callback) => {
    try {
      const url = new URL(request.url);
      const filePath = decodeURIComponent(url.pathname).replace(/^\//, '');
      const resolved = path.normalize(path.join(cacheRoot, filePath));
      callback({ path: resolved });
    } catch (e) {
      callback({ error: -6 }); // net::ERR_FILE_NOT_FOUND
    }
  });

  // Fix absolute asset paths like /_astro/* when loading from file://
  const distDir = path.join(__dirname, '..', 'dist');
  protocol.interceptFileProtocol('file', (request, callback) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      const posixPath = pathname.replace(/\\/g, '/');
      const astroIndex = posixPath.indexOf('/_astro/');
      if (astroIndex !== -1) {
        const rest = posixPath.substring(astroIndex + '/_astro/'.length);
        const resolved = path.join(distDir, '_astro', rest);
        return callback({ path: resolved });
      }
      if (posixPath.endsWith('/favicon.svg') || /\/favicon\.svg$/i.test(posixPath)) {
        const resolved = path.join(distDir, 'favicon.svg');
        return callback({ path: resolved });
      }
      return callback({ path: pathname });
    } catch (e) {
      return callback({ error: -6 });
    }
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Basic IPC placeholders
ipcMain.handle('select-directory', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

ipcMain.handle('settings:get', () => getAllSettings());
ipcMain.handle('settings:set', (_e, { key, value }) => setSetting(key, value));

ipcMain.handle('download:checksums', async (_e, { baseUrl }) => {
  return fetchChecksums(baseUrl);
});

ipcMain.handle('download:all', async (e, { baseUrl, checksums, installDir, includeOptional, concurrency, partConcurrency }) => {
  const emit = (channel, payload) => e.sender.send(channel, payload);
  activeDownloadToken = createCancelToken();
  try {
    await downloadAll(baseUrl, checksums, installDir, emit, Boolean(includeOptional), Number(concurrency) || 4, Number(partConcurrency) || 4, activeDownloadToken);
  } finally {
    activeDownloadToken = null;
  }
  return true;
});

ipcMain.handle('default-install-dir', (_e, { channelName }) => {
  // Prefer app path one level up, then "R5V Library"
  const appPath = app.getAppPath();
  const base = path.resolve(appPath, '..');
  const lib = path.join(base, 'R5V Library');
  return channelName ? path.join(lib, channelName) : lib;
});

ipcMain.handle('launcher:config', async (_e, { url }) => {
  const fetchJson = (targetUrl) => new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`));
        res.resume();
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
  return fetchJson(url);
});

ipcMain.handle('video:cache', async (_e, { filename }) => {
  const base = 'https://blaze.playvalkyrie.org/video_backgrounds';
  const url = `${base}/${filename}`;
  const root = path.join(path.resolve(app.getAppPath(), '..'), 'cache');
  const cacheDir = path.join(root, 'videos');
  const dest = path.join(cacheDir, filename);
  await fs.promises.mkdir(cacheDir, { recursive: true });
  // If exists, return immediately
  try { await fs.promises.access(dest); return `r5v://videos/${filename}`; } catch {}
  // Download
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) { file.close(() => {}); fs.unlink(dest, () => {}); reject(new Error(`HTTP ${res.statusCode} video`)); res.resume(); return; }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => { fs.unlink(dest, () => reject(err)); });
  });
  return `r5v://videos/${filename}`;
});

ipcMain.on('window:minimize', () => { mainWindow?.minimize(); });
ipcMain.on('window:maximize', () => { if (!mainWindow) return; if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
ipcMain.on('window:close', () => { mainWindow?.close(); });

app.on('before-quit', () => {
  if (activeDownloadToken) {
    try { cancelToken(activeDownloadToken); } catch {}
  }
});


