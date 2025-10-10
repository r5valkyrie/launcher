import { app, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Registers video caching IPC handler
 */
export function registerVideoHandlers() {
  ipcMain.handle('video:cache', async (_e, { filename }) => {
    try {
      const base = 'https://blaze.playvalkyrie.org/video_backgrounds';
      const url = `${base}/${filename}`;
      const root = path.join(path.resolve(app.getAppPath(), '..'), 'cache');
      const cacheDir = path.join(root, 'videos');
      const dest = path.join(cacheDir, filename);

      // Also create path in dist directory for serving
      // When bundled by esbuild, all code is in electron/main.js, so __dirname is electron/
      // We need to go up from electron/ to project root, then into dist/
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
}
