import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';

const installingModsInFlight = new Set();
const modWatchers = new Map();
const modWatcherTimers = new Map();

// ---- VDF Parsing Functions ----

/**
 * Reads mods.vdf and returns a map of mod IDs to enabled status
 */
function readModsVdf(modsDir) {
  try {
    const vdfPath = path.join(modsDir, 'mods.vdf');
    const txt = fs.readFileSync(vdfPath, 'utf-8');
    const map = {};
    // naive parse: find lines with "name"  "0/1"
    const re = /"([^"]+)"\s*"([01])"/g;
    let m;
    while ((m = re.exec(txt))) {
      const k = m[1];
      if (k && k !== 'ModList') map[k] = m[2] === '1';
    }
    return map;
  } catch { 
    return {}; 
  }
}

/**
 * Reads mods.vdf and returns both a map and the order of mod IDs
 */
function readModsVdfOrdered(modsDir) {
  try {
    const vdfPath = path.join(modsDir, 'mods.vdf');
    const txt = fs.readFileSync(vdfPath, 'utf-8');
    const map = {};
    const order = [];
    const re = /"([^"]+)"\s*"([01])"/g;
    let m;
    while ((m = re.exec(txt))) {
      const k = m[1];
      if (!k || k === 'ModList') continue;
      if (!(k in map)) order.push(k);
      map[k] = m[2] === '1';
    }
    return { map, order };
  } catch { 
    return { map: {}, order: [] }; 
  }
}

/**
 * Parses mod.vdf to extract mod id and name
 */
function parseModVdf(modVdfPath) {
  try {
    const txt = fs.readFileSync(modVdfPath, 'utf-8');
    const idMatch = txt.match(/"id"\s*"([^"]+)"/i);
    const nameMatch = txt.match(/"name"\s*"([^"]+)"/i);
    const id = idMatch ? idMatch[1] : null;
    const name = nameMatch ? nameMatch[1] : null;
    return { id, name };
  } catch { 
    return { id: null, name: null }; 
  }
}

/**
 * Writes mods.vdf with the given map of mod IDs to enabled status
 */
function writeModsVdf(modsDir, map) {
  const lines = ['"ModList"', '{'];
  for (const [k, v] of Object.entries(map)) {
    lines.push(`\t"${k}"\t\t"${v ? '1' : '0'}"`);
  }
  lines.push('}');
  fs.mkdirSync(modsDir, { recursive: true });
  fs.writeFileSync(path.join(modsDir, 'mods.vdf'), lines.join('\n'), 'utf-8');
}

/**
 * Writes mods.vdf with a specific order
 */
function writeModsVdfOrdered(modsDir, order, map) {
  const seen = new Set();
  const lines = ['"ModList"', '{'];
  const pushLine = (k) => {
    lines.push(`\t"${k}"\t\t"${map[k] ? '1' : '0'}"`);
    seen.add(k);
  };
  for (const k of Array.isArray(order) ? order : []) {
    if (Object.prototype.hasOwnProperty.call(map, k) && !seen.has(k)) pushLine(k);
  }
  for (const k of Object.keys(map)) {
    if (!seen.has(k)) pushLine(k);
  }
  lines.push('}');
  fs.mkdirSync(modsDir, { recursive: true });
  fs.writeFileSync(path.join(modsDir, 'mods.vdf'), lines.join('\n'), 'utf-8');
}

// ---- IPC Handlers ----

/**
 * Lists all installed mods
 */
async function handleListInstalled(_e, { installDir }) {
  try {
    const modsDir = path.join(installDir, 'mods');
    const { map: enabledMap, order } = readModsVdfOrdered(modsDir);
    const list = [];
    const entries = fs.existsSync(modsDir) ? fs.readdirSync(modsDir, { withFileTypes: true }) : [];
    
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const modPath = path.join(modsDir, ent.name);
      const manifestPath = path.join(modPath, 'manifest.json');
      const vdfPath = path.join(modPath, 'mod.vdf');
      const iconPath = path.join(modPath, 'icon.png');
      
      let manifest = null;
      try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch {}
      
      const meta = parseModVdf(vdfPath);
      const id = meta.id || manifest?.name || ent.name;
      
      let iconDataUrl = null;
      try {
        const buf = fs.readFileSync(iconPath);
        iconDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
      } catch {}
      
      list.push({
        id,
        // Prefer manifest name when present, then mod.vdf name, then folder
        name: manifest?.name || meta.name || ent.name,
        folder: ent.name,
        version: manifest?.version_number || null,
        description: manifest?.description || '',
        enabled: id ? !!enabledMap[id] : false,
        hasManifest: fs.existsSync(manifestPath),
        iconDataUrl,
      });
    }
    
    // Sort by mods.vdf order when possible
    const indexById = new Map(order.map((k, idx) => [k, idx]));
    list.sort((a, b) => {
      const ai = a.id != null && indexById.has(a.id) ? indexById.get(a.id) : Number.MAX_SAFE_INTEGER;
      const bi = b.id != null && indexById.has(b.id) ? indexById.get(b.id) : Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    
    return { ok: true, mods: list };
  } catch (e) { 
    return { ok: false, error: String(e?.message || e) }; 
  }
}

/**
 * Enables or disables a mod
 */
async function handleSetEnabled(_e, { installDir, name, enabled }) {
  try {
    const modsDir = path.join(installDir, 'mods');
    const { map } = readModsVdfOrdered(modsDir);
    // Here 'name' is expected to be the mod ID
    map[name] = !!enabled;
    writeModsVdfOrdered(modsDir, undefined, map);
    return { ok: true };
  } catch (e) { 
    return { ok: false, error: String(e?.message || e) }; 
  }
}

/**
 * Reorders mods
 */
async function handleReorder(_e, { installDir, orderIds }) {
  try {
    const modsDir = path.join(installDir, 'mods');
    const { map, order: existingOrder } = readModsVdfOrdered(modsDir);
    const sanitized = Array.isArray(orderIds) 
      ? orderIds.filter((id) => typeof id === 'string' && id && Object.prototype.hasOwnProperty.call(map, id)) 
      : [];
    
    // Preserve any remaining IDs in their previous relative order
    const existingSet = new Set(sanitized);
    const tail = existingOrder.filter((id) => Object.prototype.hasOwnProperty.call(map, id) && !existingSet.has(id));
    const finalOrder = [...sanitized, ...tail];
    
    writeModsVdfOrdered(modsDir, finalOrder, map);
    return { ok: true };
  } catch (e) { 
    return { ok: false, error: String(e?.message || e) }; 
  }
}

/**
 * Uninstalls a mod
 */
async function handleUninstall(_e, { installDir, folder }) {
  try {
    const modsDir = path.join(installDir, 'mods');
    const target = path.join(modsDir, folder);
    fs.rmSync(target, { recursive: true, force: true });
    return { ok: true };
  } catch (e) { 
    return { ok: false, error: String(e?.message || e) }; 
  }
}

/**
 * Fetches all available mods from Thunderstore
 */
async function handleFetchAll(_e, { query }) {
  const indexUrl = 'https://thunderstore.io/c/r5valkyrie/api/v1/package-listing-index/';
  
  const fetchBuffer = (url) => new Promise((resolve, reject) => {
    const req = https.get(url, { 
      headers: { 
        'User-Agent': 'R5Valkyrie-Launcher/1.0', 
        'Accept': '*/*' 
      } 
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = res.headers.location.startsWith('http') 
          ? res.headers.location 
          : new URL(res.headers.location, url).toString();
        return resolve(fetchBuffer(next));
      }
      if (res.statusCode !== 200) { 
        res.resume(); 
        return reject(new Error(`HTTP ${res.statusCode}`)); 
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });

  const gunzipMaybe = (buf) => {
    try { return zlib.gunzipSync(buf); } catch { return buf; }
  };

  try {
    const idxBuf = await fetchBuffer(indexUrl);
    const idxJson = JSON.parse(gunzipMaybe(idxBuf).toString('utf8'));
    const urls = Array.isArray(idxJson) ? idxJson : [];
    const concurrency = 6;
    const results = [];
    let i = 0;
    
    await Promise.all(Array.from({ length: concurrency }).map(async () => {
      while (i < urls.length) {
        const j = i++;
        const u = urls[j];
        try {
          const buf = await fetchBuffer(u);
          const text = gunzipMaybe(buf).toString('utf8');
          const packages = JSON.parse(text);
          if (Array.isArray(packages)) results.push(...packages);
        } catch {}
      }
    }));
    
    let packs = results;
    if (query && String(query).trim()) {
      const q = String(query).toLowerCase();
      packs = packs.filter(p => 
        String(p?.name || '').toLowerCase().includes(q) || 
        String(p?.full_name || '').toLowerCase().includes(q)
      );
    }
    return { ok: true, mods: packs };
  } catch (e) {
    // Fallback to simple endpoint if index fails
    try {
      const fallbackUrl = 'https://thunderstore.io/c/r5valkyrie/api/v1/package/';
      const buf = await fetchBuffer(fallbackUrl);
      const json = JSON.parse(buf.toString('utf8'));
      let packs = Array.isArray(json) ? json : [];
      if (query && String(query).trim()) {
        const q = String(query).toLowerCase();
        packs = packs.filter(p => 
          String(p?.name || '').toLowerCase().includes(q) || 
          String(p?.full_name || '').toLowerCase().includes(q)
        );
      }
      return { ok: true, mods: packs };
    } catch (err) {
      return { ok: false, error: String(err?.message || e?.message || err || e) };
    }
  }
}

/**
 * Installs a mod from Thunderstore
 */
async function handleInstall(e, { installDir, name, downloadUrl }) {
  if (!downloadUrl.startsWith('https://thunderstore.io')) {
    return { ok: false, error: "Download URL does not point to Thunderstore" };
  }

  try {
    const folderKey = String(name || '').trim();
    if (!folderKey) return { ok: false, error: 'Invalid mod name' };
    
    if (installingModsInFlight.has(folderKey)) {
      return { ok: true };
    }
    installingModsInFlight.add(folderKey);
    
    const modsDir = path.join(installDir, 'mods');
    fs.mkdirSync(modsDir, { recursive: true });
    
    // Place temp zip alongside destination to avoid using C: drive temp
    const tempZip = path.join(modsDir, `.__mod_${Date.now()}.zip`);
    
    // Download zip with redirect support
    const downloadWithRedirects = (url, depth = 0) => new Promise((resolve, reject) => {
      if (depth > 5) return reject(new Error('Too many redirects'));
      const file = fs.createWriteStream(tempZip);
      const req = https.get(url, {
        headers: {
          'User-Agent': 'R5Valkyrie-Launcher/1.0',
          'Accept': 'application/octet-stream,*/*;q=0.8',
          'Referer': 'https://thunderstore.io/',
          'Connection': 'keep-alive',
        },
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          file.close(() => {});
          try { fs.unlinkSync(tempZip); } catch {}
          const next = res.headers.location.startsWith('http') 
            ? res.headers.location 
            : new URL(res.headers.location, url).toString();
          return resolve(downloadWithRedirects(next, depth + 1));
        }
        if (res.statusCode !== 200) { 
          file.close(() => {}); 
          try { fs.unlinkSync(tempZip); } catch {}
          res.resume(); 
          return reject(new Error(`HTTP ${res.statusCode}`)); 
        }
        
        const total = Number(res.headers['content-length'] || 0);
        let received = 0;
        let lastTick = Date.now();
        const emit = (phase) => {
          try { 
            e?.sender?.send('mods:progress', { key: name, phase, received, total }); 
          } catch {}
        };
        
        res.on('data', (chunk) => {
          received += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
          const now = Date.now();
          if (now - lastTick > 150) { 
            lastTick = now; 
            emit('downloading'); 
          }
        });
        
        res.pipe(file);
        file.on('finish', () => { 
          emit('downloading'); 
          file.close(resolve); 
        });
      });
      req.on('error', (err) => { 
        try { fs.unlinkSync(tempZip); } catch {} 
        reject(err); 
      });
    });
    
    await downloadWithRedirects(downloadUrl);
    
    // Extract using PowerShell Expand-Archive (Windows)
    try { 
      e?.sender?.send('mods:progress', { key: name, phase: 'extracting' }); 
    } catch {}
    
    const dest = path.join(modsDir, name);
    try { fs.rmSync(dest, { recursive: true, force: true }); } catch {}
    fs.mkdirSync(dest, { recursive: true });
    
    await new Promise((resolve, reject) => {
      const ps = spawn('powershell.exe', [
        '-NoProfile', 
        '-NonInteractive', 
        '-Command', 
        `Expand-Archive -LiteralPath "${tempZip}" -DestinationPath "${dest}" -Force`
      ], { stdio: 'ignore' });
      ps.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Expand-Archive failed ${code}`)));
      ps.on('error', reject);
    });
    
    try { fs.unlinkSync(tempZip); } catch {}
    
    // Determine mod ID from mod.vdf
    let modId = null;
    try {
      const primary = path.join(dest, 'mod.vdf');
      if (fs.existsSync(primary)) {
        modId = parseModVdf(primary).id;
      } else {
        const children = fs.readdirSync(dest, { withFileTypes: true });
        for (const ent of children) {
          if (ent.isDirectory()) {
            const p = path.join(dest, ent.name, 'mod.vdf');
            if (fs.existsSync(p)) { 
              modId = parseModVdf(p).id; 
              if (modId) break; 
            }
          }
        }
      }
    } catch {}
    
    // Enable by ID (fallback to name)
    const map = readModsVdf(modsDir);
    map[modId || name] = true;
    writeModsVdf(modsDir, map);
    
    try { 
      e?.sender?.send('mods:progress', { key: name, phase: 'done' }); 
    } catch {}
    
    return { ok: true };
  } catch (e) { 
    return { ok: false, error: String(e?.message || e) }; 
  } finally {
    try { 
      installingModsInFlight.delete(String(name || '')); 
    } catch {}
  }
}

/**
 * Watches the mods directory for changes
 */
async function handleWatch(e, { installDir }, getMainWindow) {
  try {
    const modsDir = path.join(installDir, 'mods');
    if (!fs.existsSync(modsDir)) return { ok: true };
    
    const key = modsDir;
    if (modWatchers.has(key)) return { ok: true };
    
    const watcher = fs.watch(modsDir, { persistent: true }, (_eventType, _filename) => {
      const tkey = key;
      clearTimeout(modWatcherTimers.get(tkey));
      const timer = setTimeout(() => {
        try { 
          getMainWindow()?.webContents?.send('mods:changed', { installDir }); 
        } catch {}
      }, 300);
      modWatcherTimers.set(tkey, timer);
    });
    
    modWatchers.set(key, watcher);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * Stops watching the mods directory
 */
async function handleUnwatch(_e, { installDir }) {
  try {
    const modsDir = path.join(installDir, 'mods');
    const key = modsDir;
    const watcher = modWatchers.get(key);
    if (watcher) {
      try { watcher.close(); } catch {}
      modWatchers.delete(key);
    }
    const t = modWatcherTimers.get(key);
    if (t) { 
      clearTimeout(t); 
      modWatcherTimers.delete(key); 
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * Gets the icon data URL for a mod
 */
async function handleIconDataUrl(_e, { installDir, folder }) {
  try {
    const p = path.join(installDir, 'mods', folder, 'icon.png');
    await fs.promises.access(p);
    const buf = await fs.promises.readFile(p);
    const b64 = buf.toString('base64');
    return { ok: true, dataUrl: `data:image/png;base64,${b64}` };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Sets up all mods-related IPC handlers
 */
export function setupModsIPC(ipcMain, getMainWindow) {
  ipcMain.handle('mods:listInstalled', handleListInstalled);
  ipcMain.handle('mods:setEnabled', handleSetEnabled);
  ipcMain.handle('mods:reorder', handleReorder);
  ipcMain.handle('mods:uninstall', handleUninstall);
  ipcMain.handle('mods:fetchAll', handleFetchAll);
  ipcMain.handle('mods:install', handleInstall);
  ipcMain.handle('mods:watch', (e, args) => handleWatch(e, args, getMainWindow));
  ipcMain.handle('mods:unwatch', handleUnwatch);
  ipcMain.handle('mods:iconDataUrl', handleIconDataUrl);
}
