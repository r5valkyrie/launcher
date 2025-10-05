import { protocol, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Registers custom file protocol for cached files
 */
export function registerCacheProtocol() {
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
}

/**
 * Intercepts file protocol to fix asset paths
 */
export function interceptFileProtocol() {
  const distDir = path.join(__dirname, '..', '..', 'dist');
  
  protocol.interceptFileProtocol('file', (request, callback) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      const posixPath = pathname.replace(/\\/g, '/');
      
      // Fix /_astro/ paths
      const astroIndex = posixPath.indexOf('/_astro/');
      if (astroIndex !== -1) {
        const rest = posixPath.substring(astroIndex + '/_astro/'.length);
        const resolved = path.join(distDir, '_astro', rest);
        return callback({ path: resolved });
      }
      
      // Fix favicon paths
      if (posixPath.endsWith('/favicon.svg') || /\/favicon\.svg$/i.test(posixPath)) {
        const resolved = path.join(distDir, 'favicon.svg');
        return callback({ path: resolved });
      }
      
      // Map absolute-root public assets to dist root in production
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
