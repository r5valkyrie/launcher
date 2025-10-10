import { ipcMain } from 'electron';
import https from 'node:https';
import { getSetting, setSetting } from '../settings-store.js';

/**
 * Registers network-related IPC handlers
 */
export function registerNetworkHandlers() {
  // Launcher config with offline mode support
  ipcMain.handle('network:getLauncherConfig', async (_e, { url }) => {
    const fetchJson = (targetUrl) => new Promise((resolve, reject) => {
      const request = https.get(targetUrl, (res) => {
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

      // Set timeout for network requests
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Network timeout'));
      });
    });

    try {
      // Try to fetch config from network
      const config = await fetchJson(url);

      // Cache the successful config
      setSetting('cachedLauncherConfig', {
        config,
        url,
        cachedAt: Date.now()
      });

      return { ...config, _offline: false };
    } catch (err) {
      // Network failed - try to use cached config
      const cached = getSetting('cachedLauncherConfig');

      if (cached && cached.config && cached.url === url) {
        console.log('[Offline Mode] Using cached launcher config from', new Date(cached.cachedAt));
        return { ...cached.config, _offline: true, _cachedAt: cached.cachedAt };
      }

      // No cache available, throw the error
      throw err;
    }
  });

  // EULA
  ipcMain.handle('network:getEula', async () => {
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
}
