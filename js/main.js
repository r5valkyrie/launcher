import { app, BrowserWindow, ipcMain, dialog, protocol, shell } from 'electron';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import https from 'node:https';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
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
    width: 1150,
    height: 800,
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
  mainWindow.once('ready-to-show', ensureShown);
  mainWindow.webContents.once('did-finish-load', ensureShown);
  const safetyShow = setTimeout(ensureShown, 1000);
  mainWindow.on('show', () => clearTimeout(safetyShow));
  const isDev = !!process.env.VITE_DEV_SERVER_URL || process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

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
      // Map absolute-root public assets (e.g. /r5v_bannerBG.png) to dist root in production
      if (posixPath.startsWith('/')) {
        const rest = posixPath.replace(/^\/+/, '');
        const candidate = path.join(distDir, rest);
        try { fs.accessSync(candidate); return callback({ path: candidate }); } catch {}
      }
      return callback({ path: pathname });
    } catch (e) {
      return callback({ error: -6 });
    }
  });

  createWindow();
  // Auto-updater wiring
  try {
    autoUpdater.autoDownload = false;
    try { autoUpdater.logger = log; log.transports.file.level = 'info'; } catch {}
    autoUpdater.on('error', (err) => {
      try { mainWindow?.webContents.send('update:error', { message: String(err?.stack || err?.message || err) }); } catch {}
    });
    autoUpdater.on('update-available', (info) => {
      try { mainWindow?.webContents.send('update:available', info); } catch {}
    });
    autoUpdater.on('update-not-available', (info) => {
      try { mainWindow?.webContents.send('update:not-available', info); } catch {}
    });
    autoUpdater.on('download-progress', (p) => {
      try { mainWindow?.webContents.send('update:download-progress', p); } catch {}
    });
    autoUpdater.on('update-downloaded', (info) => {
      try { mainWindow?.webContents.send('update:downloaded', info); } catch {}
    });
  } catch {}
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
// Update IPC
ipcMain.handle('update:check', async () => {
  try { const res = await autoUpdater.checkForUpdates(); return { ok: true, result: res?.updateInfo || null }; } catch (e) { return { ok: false, error: String(e?.message || e) }; }
});
ipcMain.handle('update:download', async () => {
  try { await autoUpdater.downloadUpdate(); return { ok: true }; } catch (e) { return { ok: false, error: String(e?.message || e) }; }
});
ipcMain.handle('update:quitAndInstall', async () => {
  try { setImmediate(() => autoUpdater.quitAndInstall(false, true)); return { ok: true }; } catch (e) { return { ok: false, error: String(e?.message || e) }; }
});

ipcMain.handle('app:getVersion', async () => {
  try { return app.getVersion(); } catch { return '0.0.0'; }
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

ipcMain.handle('download:all', async (e, { baseUrl, checksums, installDir, includeOptional, concurrency, partConcurrency, channelName }) => {
  const emit = (channel, payload) => e.sender.send(channel, payload);
  activeDownloadToken = createCancelToken();
  try {
    await downloadAll(baseUrl, checksums, installDir, emit, Boolean(includeOptional), Number(concurrency) || 4, Number(partConcurrency) || 4, activeDownloadToken);
    try {
      const channels = getSetting('channels', {}) || {};
      channels[String(channelName || 'default')] = {
        installDir,
        gameVersion: checksums?.game_version || null,
        gameBaseUrl: baseUrl,
        lastUpdatedAt: Date.now(),
      };
      setSetting('channels', channels);
    } catch (persistErr) {
      console.error('Failed to persist channel info', persistErr);
    }
  } finally {
    activeDownloadToken = null;
  }
  return true;
});

ipcMain.handle('default-install-dir', (_e, { channelName }) => {
  // Default to %LOCALAPPDATA%\Programs\R5VLibrary\<channel>
  const localAppData = process.env['LOCALAPPDATA'] || path.join(app.getPath('home'), 'AppData', 'Local');
  const base = path.join(localAppData, 'Programs', 'R5VLibrary');
  return channelName ? path.join(base, channelName) : base;
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

ipcMain.handle('fs:exists', async (_e, { path: targetPath }) => {
  try { await fs.promises.access(targetPath); return true; } catch { return false; }
});

ipcMain.handle('path:open', async (_e, { path: targetPath }) => {
  try { await shell.openPath(targetPath); return true; } catch { return false; }
});

ipcMain.handle('open-external', async (_e, { url }) => {
  try { await shell.openExternal(url); return true; } catch { return false; }
});

ipcMain.handle('download:cancel', async () => {
  try { cancelToken(activeDownloadToken); } catch {}
  activeDownloadToken = null;
  try { mainWindow?.webContents.send('progress:cancelled', {}); } catch {}
  return true;
});

ipcMain.handle('select-file', async (_e, { filters }) => {
  const res = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: Array.isArray(filters) ? filters : undefined,
  });
  if (res.canceled || res.filePaths.length === 0) return null;
  return res.filePaths[0];
});

ipcMain.handle('game:launch', async (_e, { channelName, installDir, mode, argsString }) => {
  try {
    if (!installDir) throw new Error('Missing installDir');
    const exeName = String(mode).toUpperCase() === 'SERVER' ? 'r5apex_ds.exe' : 'r5apex.exe';
    const exePath = path.join(installDir, exeName);
    await fs.promises.access(exePath).catch(() => { throw new Error(`Executable not found: ${exePath}`); });
    const parseArgs = (s) => {
      if (!s || typeof s !== 'string') return [];
      const tokens = s.match(/(?:[^\s\"]+|\"[^\"]*\")+/g) || [];
      return tokens.map((t) => t.replace(/^\"|\"$/g, ''));
    };
    const args = parseArgs(argsString);
    const child = spawn(exePath, args, { cwd: installDir, detached: true, stdio: 'ignore', env: { ...process.env } });
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.on('window:minimize', () => { mainWindow?.minimize(); });
ipcMain.on('window:maximize', () => { if (!mainWindow) return; if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
ipcMain.on('window:close', () => { mainWindow?.close(); });

app.on('before-quit', () => {
  if (activeDownloadToken) {
    try { cancelToken(activeDownloadToken); } catch {}
  }
});


