import { app, protocol } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Registers custom protocol handlers for the application
 */
export function registerProtocolHandlers() {
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
  // When bundled, __dirname is electron/, so go up one level to reach dist/
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
        try {
          fs.accessSync(candidate);
          return callback({ path: candidate });
        } catch {}
      }

      return callback({ path: pathname });
    } catch (e) {
      return callback({ error: -6 });
    }
  });
}
