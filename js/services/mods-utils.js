import fs from 'node:fs';
import path from 'node:path';

export const installingModsInFlight = new Set();
export const modWatchers = new Map();
export const modWatcherTimers = new Map();

/**
 * Reads mods.vdf and returns a map of mod names to enabled state
 */
export function readModsVdf(modsDir) {
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
  } catch { return {}; }
}

/**
 * Reads mods.vdf and returns both map and order
 */
export function readModsVdfOrdered(modsDir) {
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
  } catch { return { map: {}, order: [] }; }
}

/**
 * Parses mod.vdf to extract id and name
 */
export function parseModVdf(modVdfPath) {
  try {
    const txt = fs.readFileSync(modVdfPath, 'utf-8');
    const idMatch = txt.match(/"id"\s*"([^"]+)"/i);
    const nameMatch = txt.match(/"name"\s*"([^"]+)"/i);
    const id = idMatch ? idMatch[1] : null;
    const name = nameMatch ? nameMatch[1] : null;
    return { id, name };
  } catch { return { id: null, name: null }; }
}

/**
 * Writes mods.vdf from a map
 */
export function writeModsVdf(modsDir, map) {
  const lines = ['"ModList"', '{'];
  for (const [k, v] of Object.entries(map)) {
    lines.push(`\t"${k}"\t\t"${v ? '1' : '0'}"`);
  }
  lines.push('}');
  fs.mkdirSync(modsDir, { recursive: true });
  fs.writeFileSync(path.join(modsDir, 'mods.vdf'), lines.join('\n'), 'utf-8');
}

/**
 * Writes mods.vdf with specific order
 */
export function writeModsVdfOrdered(modsDir, order, map) {
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
