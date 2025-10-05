import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { app } from 'electron';

/**
 * Parses command line arguments string
 */
function parseArgs(s) {
  if (!s || typeof s !== 'string') return [];
  const tokens = s.match(/(?:[^\s\"]+|\"[^\"]*\")+/g) || [];
  return tokens.map((t) => t.replace(/^\"|\"$/g, ''));
}

/**
 * Launches the game
 */
async function handleGameLaunch(_e, { channelName, installDir, mode, argsString, winePrefix }) {
  try {
    if (!installDir) throw new Error('Missing installDir');
    
    const exeName = String(mode).toUpperCase() === 'SERVER' ? 'r5apex_ds.exe' : 'r5apex.exe';
    const exePath = path.join(installDir, exeName);
    
    await fs.promises.access(exePath).catch(() => { 
      throw new Error(`Executable not found: ${exePath}`); 
    });
    
    const args = parseArgs(argsString);
    let child;

    if (process.platform === "win32") {
      child = spawn(exePath, args, { 
        cwd: installDir, 
        detached: true, 
        stdio: 'ignore', 
        env: { ...process.env } 
      });
    } else if (process.platform === "linux") {
      // Grab wine prefix
      const prefix = winePrefix ? winePrefix : path.join(app.getPath('home'), 'Games', 'R5VLibrary', 'wineprefix');
      // Place exe in args
      args.unshift(exePath);
      // Copy needed files
      const srcDir = path.join(app.getPath('home'), '.local', 'share', 'Steam');
      const destDir = path.join(prefix, 'drive_c', 'Program Files (x86)', 'Steam');
      // Make sure destination exists
      fs.mkdirSync(destDir, { recursive: true });
      const steamFiles = [
        'GameOverlayRenderer64.dll',
        'steamclient64.dll',
        'steamclient.dll'
      ];
      steamFiles.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        // Throw error in frontend about steam not being installed with the proper files
        if (!fs.existsSync(srcPath)) {
          const error = new Error(`Steam is not installed correctly!\nSource file not found: ${srcPath}`);
          throw error;
        }
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied: ${file}`);
        } else {
          console.log(`Skipped (exists): ${file}`);
        }
      });
      // Launch game using umu-launcher
      child = spawn("umu-run", args, { 
        cwd: installDir, 
        detached: true, 
        stdio: 'ignore', 
        env: { ...process.env, WINEPREFIX: prefix } 
      });
    }
    
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * Sets up game-related IPC handlers
 */
export function setupGameIPC(ipcMain) {
  ipcMain.handle('game:launch', handleGameLaunch);
}
