import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

const storeDir = app.getPath('userData');
const storePath = path.join(storeDir, 'settings.json');

function readStore() {
  try {
    const raw = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeStore(obj) {
  fs.mkdirSync(storeDir, { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(obj, null, 2), 'utf-8');
}

export function getSetting(key, defaultValue = undefined) {
  const s = readStore();
  return s[key] ?? defaultValue;
}

export function setSetting(key, value) {
  const s = readStore();
  s[key] = value;
  writeStore(s);
}

export function getAllSettings() {
  return readStore();
}
