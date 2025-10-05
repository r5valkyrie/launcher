import { app, ipcMain, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getAllSettings, getSetting, setSetting } from './store.js';
import { fetchChecksums, downloadAll, createCancelToken, cancelToken } from './downloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let activeDownloadToken = null;
let downloadPaused = false;

/**
 * Registers all general-purpose IPC handlers
 */
export function registerGeneralHandlers(mainWindow) {
  // App version
  ipcMain.handle('app:getVersion', async () => {
    try { return app.getVersion(); } catch { return '0.0.0'; }
  });

  // Base directory
  ipcMain.handle('app:getBaseDir', async () => {
    try {
      const baseDir = path.resolve(app.getAppPath(), '..');
      return baseDir;
    } catch {
      return '';
    }
  });

  // Launcher install root
  ipcMain.handle('app:getLauncherInstallRoot', async () => {
    try {
      const localAppData = process.env['LOCALAPPDATA'] || path.join(app.getPath('home'), 'AppData', 'Local');
      return path.join(localAppData, 'Programs', 'r5vlauncher');
    } catch {
      return '';
    }
  });

  // Directory selection
  ipcMain.handle('select-directory', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  // File selection
  ipcMain.handle('select-file', async (_e, { filters }) => {
    const res = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: Array.isArray(filters) ? filters : undefined,
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  // Settings
  ipcMain.handle('settings:get', () => getAllSettings());
  ipcMain.handle('settings:set', (_e, { key, value }) => setSetting(key, value));

  // Download handlers
  ipcMain.handle('download:checksums', async (_e, { baseUrl }) => {
    return fetchChecksums(baseUrl);
  });

  ipcMain.handle('download:all', async (e, { baseUrl, checksums, installDir, includeOptional, concurrency, partConcurrency, channelName, mode }) => {
    const emit = (channel, payload) => e.sender.send(channel, payload);
    // Respect user mods.vdf during repair/update: skip replacing it if present
    try {
      const isInstall = String(mode || 'install').toLowerCase() === 'install';
      if (!isInstall) {
        const modsVdfPath = path.join(installDir, 'mods', 'mods.vdf');
        if (fs.existsSync(modsVdfPath)) {
          const files = Array.isArray(checksums?.files) ? checksums.files : [];
          const filtered = files.filter((f) => {
            try {
              const p = String(f?.path || f?.name || '').replace(/\\/g, '/').toLowerCase();
              return p !== 'mods/mods.vdf';
            } catch { return true; }
          });
          checksums = { ...(checksums || {}), files: filtered };
        }
      }
    } catch {}
    activeDownloadToken = createCancelToken();
    downloadPaused = false;
    try {
      await downloadAll(baseUrl, checksums, installDir, emit, Boolean(includeOptional), Number(concurrency) || 4, Number(partConcurrency) || 4, activeDownloadToken, () => downloadPaused);
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

  ipcMain.handle('download:pause', async () => {
    downloadPaused = true;
    try { mainWindow?.webContents.send('progress:paused', {}); } catch {}
    return true;
  });

  ipcMain.handle('download:resume', async () => {
    downloadPaused = false;
    try { mainWindow?.webContents.send('progress:resumed', {}); } catch {}
    return true;
  });

  ipcMain.handle('download:cancel', async () => {
    try { cancelToken(activeDownloadToken); } catch {}
    activeDownloadToken = null;
    downloadPaused = false;
    try { mainWindow?.webContents.send('progress:cancelled', {}); } catch {}
    return true;
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

  // Launcher config
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

  // EULA
  ipcMain.handle('eula:get', async () => {
    const targetUrl = 'https://playvalkyrie.org/api/eula';
    const fetchJson = (url) => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); res.resume(); return; }
        const chunks = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on('end', () => {
          try { const txt = Buffer.concat(chunks).toString('utf8'); resolve(JSON.parse(txt)); } catch (e) { reject(e); }
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

  // Video cache
  ipcMain.handle('video:cache', async (_e, { filename }) => {
    try {
      const base = 'https://blaze.playvalkyrie.org/video_backgrounds';
      const url = `${base}/${filename}`;
      const root = path.join(path.resolve(app.getAppPath(), '..'), 'cache');
      const cacheDir = path.join(root, 'videos');
      const dest = path.join(cacheDir, filename);

      // Also create path in dist directory for serving
      // When bundled, __dirname is electron/, so go up one level to reach dist/
      const distDir = path.join(__dirname, '..', 'dist');
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
    try { await fs.promises.access(path.join(targetPath, 'r5apex.exe')); hasClient = true; } catch { }
    try { await fs.promises.access(path.join(targetPath, 'r5apex_ds.exe')); hasServer = true; } catch { }
    return hasClient || hasServer;
  });

  // Folder permissions
  ipcMain.handle('fix-folder-permissions', async (_e, { selectedChannel }) => {
    const errors = [];
    const folderPath = getAllSettings().channels[selectedChannel].installDir;

    try {
      if (!folderPath) {
        return { ok: false, error: 'No folder path provided' };
      }

      // Normalize the path for Windows commands
      const normalizedPath = path.resolve(folderPath).replace(/\//g, '\\');

      // Validate path format
      if (!normalizedPath || normalizedPath.length < 3) {
        return { ok: false, error: `Invalid path format: ${folderPath}` };
      }

      // Check if path contains invalid characters for Windows commands
      // Allow colon only in drive letter position (e.g., C:\)
      const pathWithoutDrive = normalizedPath.length >= 3 && normalizedPath[1] === ':' ?
        normalizedPath.slice(3) : normalizedPath; // Skip "C:\" part
      const invalidChars = /[<>:"|?*]/;
      if (invalidChars.test(pathWithoutDrive)) {
        return { ok: false, error: `Path contains invalid characters: ${normalizedPath}` };
      }

      // Get current user
      const userInfo = os.userInfo();
      const username = userInfo.username;

      // Check if elevate.exe exists
      const elevateExePath = path.join(process.resourcesPath, 'elevate.exe');
      const useElevate = fs.existsSync(elevateExePath);

      // Ensure directory exists
      try {
        fs.mkdirSync(normalizedPath, { recursive: true });
      } catch (nodeCreateError) {
        // Directory creation may fail, but we'll continue with permission setting
      }

      const commands = [
        // Grant permissions using separate arguments instead of embedded quotes
        {
          exe: 'icacls',
          args: [normalizedPath, '/grant', `${username}:F`, '/t', '/q'],
          desc: `Grant permissions to current user (${username})`
        },
        {
          exe: 'icacls',
          args: [normalizedPath, '/grant', 'Everyone:F', '/t', '/q'],
          desc: 'Grant Everyone full permissions'
        },
        {
          exe: 'icacls',
          args: [normalizedPath, '/grant', 'Users:F', '/t', '/q'],
          desc: 'Grant Users full permissions'
        },
      ];

      for (let i = 0; i < commands.length; i++) {
        const { exe, args, desc } = commands[i];
        try {

          const result = await new Promise((resolve, reject) => {
            // Use elevate.exe to run the command with admin privileges, or try without if not available
            let child;
            let spawnArgs;
            let spawnOptions;

            if (useElevate) {
              // With elevate.exe, we need to pass the exe and args through cmd /c
              spawnArgs = [elevateExePath, ['-wait', exe, ...args]];
              spawnOptions = {
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true
              };
            } else {
              // Without elevation, run the command directly
              spawnArgs = [exe, args];
              spawnOptions = {
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true
              };
            }


            try {
              child = spawn(spawnArgs[0], spawnArgs[1], spawnOptions);
            } catch (spawnError) {
              console.error(`[Permission Fix] Spawn failed:`, spawnError);
              reject(spawnError);
              return;
            }

            let stdout = '';
            let stderr = '';

            if (child.stdout) {
              child.stdout.on('data', (data) => {
                stdout += data.toString();
              });
            }

            if (child.stderr) {
              child.stderr.on('data', (data) => {
                stderr += data.toString();
              });
            }

            child.on('exit', (code, signal) => {
              resolve({ code, stdout, stderr, signal });
            });

            child.on('error', (err) => {
              reject(err);
            });

            // Set a timeout to prevent hanging
            setTimeout(() => {
              try {
                child.kill();
              } catch {}
              reject(new Error('Command timeout'));
            }, 30000);
          });

          if (result.code !== 0) {
            // Some commands are expected to fail (like duplicate permission grants), so be more lenient
            const errorOutput = result.stderr || result.stdout || 'Unknown error';
            const isMinorError = errorOutput.includes('duplicate') ||
                                errorOutput.includes('already') ||
                                result.code === 1332; // SID mapping error - try other formats

            if (!isMinorError) {
              const errorMsg = `${desc} failed (code ${result.code}): ${errorOutput}`;
              errors.push(errorMsg);
            }
          }

        } catch (error) {
          const errorMsg = `${desc} error: ${error.message}`;
          errors.push(errorMsg);
        }
      }

      // Verify the folder exists and is writable
      try {
        const testFile = path.join(normalizedPath, 'test_write.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        const errorMsg = `Write test failed: ${error.message}`;
        errors.push(errorMsg);

        // Try a simple fallback approach
        try {
          fs.mkdirSync(normalizedPath, { recursive: true });

          const result = await new Promise((resolve) => {
            const child = spawn('cmd', ['/c', `icacls "${normalizedPath}" /grant "%USERNAME%":F /q`], {
              stdio: 'ignore',
              windowsHide: true
            });
            child.on('exit', (code) => resolve({ code }));
            child.on('error', () => resolve({ code: 1 }));

            setTimeout(() => {
              try { child.kill(); } catch {}
              resolve({ code: 1 });
            }, 5000);
          });

          if (result.code === 0) {
            const testFile2 = path.join(normalizedPath, 'test_write2.tmp');
            fs.writeFileSync(testFile2, 'test');
            fs.unlinkSync(testFile2);
            return { ok: true, warnings: errors };
          }
        } catch (fallbackError) {
          // Fallback failed too
        }

        return { ok: false, error: errorMsg, details: errors };
      }

      if (errors.length > 0) {
        return { ok: true, warnings: errors };
      }

      return { ok: true };

    } catch (error) {
      const errorMsg = `Unexpected error: ${error?.message || error}`;
      errors.push(errorMsg);
      return { ok: false, error: errorMsg, details: errors };
    }
  });

  // Window controls
  ipcMain.on('window:minimize', () => { mainWindow?.minimize(); });
  ipcMain.on('window:maximize', () => { if (!mainWindow) return; if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
  ipcMain.on('window:close', () => { mainWindow?.close(); });
}

/**
 * Cleanup function to call before app quits
 */
export function cleanupBeforeQuit() {
  if (activeDownloadToken) {
    try { cancelToken(activeDownloadToken); } catch {}
  }
}
