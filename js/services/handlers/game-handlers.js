import { app, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

/**
 * Registers game-related IPC handlers
 */
export function registerGameHandlers() {
  ipcMain.handle('game:listProtonVersions', async () => {
    if (process.platform !== 'linux') {
      return { ok: true, versions: [] };
    }

    try {
      const versions = [];
      const homeDir = app.getPath('home');

      // Common Proton installation paths
      const searchPaths = [
        path.join(homeDir, '.local', 'share', 'Steam', 'steamapps', 'common'),
      ];

      const extraCompatibilityTools = [
        path.join(homeDir, '.local', 'share', 'Steam', 'compatibilitytools.d'),
      ];

      for (const searchPath of searchPaths) {
        try {
          if (!fs.existsSync(searchPath)) continue;

          const entries = fs.readdirSync(searchPath, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const dirName = entry.name;
            const fullPath = path.join(searchPath, dirName);

            // Check if it's a Proton directory (has proton or contains "Proton" in name)
            if (dirName.toLowerCase().includes('proton')) {
              // Verify it has the proton executable
              const protonExe = path.join(fullPath, 'files', 'bin', 'wineserver');
              const legacyProtonExe = path.join(fullPath, 'dist', 'bin', 'wineserver');
              if (fs.existsSync(protonExe) || fs.existsSync(legacyProtonExe)) {
                versions.push({
                  name: dirName,
                  path: fullPath,
                });
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to scan ${searchPath}:`, err);
        }
      }

      for (const searchPath of extraCompatibilityTools) {
        try {
          if (!fs.existsSync(searchPath)) continue;

          const entries = fs.readdirSync(searchPath, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const dirName = entry.name;
            const fullPath = path.join(searchPath, dirName);

            versions.push({
              name: dirName,
              path: fullPath,
            });
          }
        } catch (err) {
          console.warn(`Failed to scan ${searchPath}:`, err);
        }
      }

      // Sort versions: GE-Proton first, then by name (newest first)
      versions.sort((a, b) => {
        return b.name.localeCompare(a.name);
      });

      versions.unshift({
        name: 'Default (Latest UMU-Proton)',
        path: ''
      });

      return { ok: true, versions };
    } catch (err) {
      return { ok: false, error: String(err?.message || err), versions: [] };
    }
  });

  ipcMain.handle('game:launch', async (_e, { channelName, installDir, mode, argsString, winePrefix, protonVersion }) => {
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

      let child;

      if (process.platform === "win32") {
        child = spawn(exePath, args, { cwd: installDir, detached: true, stdio: 'ignore', env: { ...process.env } });
      } else if (process.platform === "linux") {
        // grab wine prefix
        const prefix = winePrefix ? winePrefix : path.join(app.getPath('home'), 'Games', 'R5VLibrary', 'wineprefix');
        // place exe in args
        args.unshift(exePath);
        // copy needed files
        let srcDir = path.join(app.getPath('home'), '.local', 'share', 'Steam');
        let destDir = path.join(prefix, 'drive_c', 'Program Files (x86)', 'Steam');
        // make sure destination exists
        fs.mkdirSync(destDir, { recursive: true });
        const steamFiles = [
          'GameOverlayRenderer64.dll',
          'steamclient64.dll',
          'steamclient.dll'
        ];
        steamFiles.forEach(file => {
          const srcPath = path.join(srcDir, file);
          const destPath = path.join(destDir, file);
          // throw error in frontend about steam not being installed with the proper files.
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
        // launch game using umu-launcher
        child = spawn("umu-run", args, { cwd: installDir, detached: true, stdio: 'ignore', env: { ...process.env, WINEPREFIX: prefix, PROTONPATH: protonVersion ? protonVersion : undefined } });
      }
      child.unref();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    }
  });
}
