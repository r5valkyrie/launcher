import { app, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { getAllSettings, getSetting, setSetting } from '../services/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sets up basic IPC handlers
 */
export function setupBasicIPC(ipcMain) {
  // App info handlers
  ipcMain.handle('app:getVersion', async () => {
    try { 
      return app.getVersion(); 
    } catch { 
      return '0.0.0'; 
    }
  });

  ipcMain.handle('app:getBaseDir', async () => {
    try {
      const baseDir = path.resolve(app.getAppPath(), '..');
      return baseDir;
    } catch {
      return '';
    }
  });

  ipcMain.handle('app:getLauncherInstallRoot', async () => {
    try {
      const localAppData = process.env['LOCALAPPDATA'] || path.join(app.getPath('home'), 'AppData', 'Local');
      return path.join(localAppData, 'Programs', 'r5vlauncher');
    } catch {
      return '';
    }
  });

  // Settings handlers
  ipcMain.handle('settings:get', () => getAllSettings());
  ipcMain.handle('settings:set', (_e, { key, value }) => setSetting(key, value));

  // File dialog handlers
  ipcMain.handle('select-directory', async () => {
    const res = await dialog.showOpenDialog({ 
      properties: ['openDirectory', 'createDirectory'] 
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle('select-file', async (_e, { filters }) => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: Array.isArray(filters) ? filters : undefined,
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  // Default install directory
  ipcMain.handle('default-install-dir', (_e, { channelName }) => {
    // Default to %LOCALAPPDATA%\Programs\R5VLibrary\<channel>
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

  // Launcher config fetcher
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
          try { 
            resolve(JSON.parse(data)); 
          } catch (e) { 
            reject(e); 
          }
        });
      }).on('error', reject);
    });
    return fetchJson(url);
  });

  // EULA fetcher
  ipcMain.handle('eula:get', async () => {
    const targetUrl = 'https://playvalkyrie.org/api/eula';
    const fetchJson = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) { 
          reject(new Error(`HTTP ${res.statusCode}`)); 
          res.resume(); 
          return; 
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          try { 
            const txt = Buffer.concat(chunks).toString('utf8'); 
            resolve(JSON.parse(txt)); 
          } catch (e) { 
            reject(e); 
          }
        });
      }).on('error', reject);
    });
    
    try {
      const json = await fetchJson(targetUrl);
      return { ok: true, json };
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
  });

  // Video cache handler
  ipcMain.handle('video:cache', async (_e, { filename }) => {
    try {
      const base = 'https://blaze.playvalkyrie.org/video_backgrounds';
      const url = `${base}/${filename}`;
      const root = path.join(path.resolve(app.getAppPath(), '..'), 'cache');
      const cacheDir = path.join(root, 'videos');
      const dest = path.join(cacheDir, filename);
      
      // Also create path in dist directory for serving
      const distDir = path.join(__dirname, '..', '..', 'dist');
      const distVideoDest = path.join(distDir, filename);
      
      await fs.promises.mkdir(cacheDir, { recursive: true });
      
      // If exists in cache, verify it's a valid file
      try { 
        const stat = await fs.promises.stat(dest);
        if (stat.size > 0) {
          // Copy to dist directory if not already there
          try {
            await fs.promises.access(distVideoDest);
          } catch {
            await fs.promises.copyFile(dest, distVideoDest);
          }
          // Return relative URL to the file in dist
          return `./${filename}`;
        } else {
          // File exists but is empty, delete it and re-download
          await fs.promises.unlink(dest);
        }
      } catch {}
      
      // Download with better error handling
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const request = https.get(url, (res) => {
          if (res.statusCode !== 200) { 
            file.close(() => {});
            fs.unlink(dest, () => {});
            reject(new Error(`HTTP ${res.statusCode} for video ${filename}`));
            res.resume();
            return;
          }
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
          });
        });
        
        request.on('error', (err) => {
          file.close(() => {});
          fs.unlink(dest, () => {});
          reject(err);
        });
        
        // Add timeout
        request.setTimeout(30000, () => {
          request.destroy();
          file.close(() => {});
          fs.unlink(dest, () => {});
          reject(new Error(`Video download timeout for ${filename}`));
        });
      });
      
      // Copy to dist directory for serving
      await fs.promises.copyFile(dest, distVideoDest);
      
      // Return relative URL to the file in dist
      return `./${filename}`;
    } catch (error) {
      console.error(`Video cache error for ${filename}:`, error);
      throw error;
    }
  });

  // File system check
  ipcMain.handle('fs:is-installed-in-dir', async (_e, { path: targetPath }) => {
    let hasClient = false;
    let hasServer = false;
    try { 
      await fs.promises.access(path.join(targetPath, 'r5apex.exe')); 
      hasClient = true; 
    } catch { }
    try { 
      await fs.promises.access(path.join(targetPath, 'r5apex_ds.exe')); 
      hasServer = true; 
    } catch { }
    return hasClient || hasServer;
  });
}
