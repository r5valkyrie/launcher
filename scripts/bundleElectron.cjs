/* eslint-disable */
const path = require('path');
const fs = require('fs');
const { build } = require('esbuild');

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }


(async () => {
  const projectRoot = path.resolve(__dirname, '..');
  const outDir = path.join(projectRoot, 'electron');
  ensureDir(outDir);
  ensureDir(path.join(outDir, 'services'));
  ensureDir(path.join(outDir, 'services', 'handlers'));

  // Bundle main (ESM)
  await build({
    entryPoints: [path.join(projectRoot, 'js', 'main.js')],
    outfile: path.join(projectRoot, 'electron', 'main.js'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    minify: true,
    sourcemap: false,
    logLevel: 'silent',
    external: ['electron', 'fs', 'path', 'node:fs', 'node:path', 'https', 'node:https', 'child_process', 'node:child_process'],
  });
  // Avoid obfuscating main to keep Node/Electron semantics intact

  // Bundle preload (CJS maintained if needed)
  const preloadSrc = path.join(projectRoot, 'js', 'preload.cjs');
  if (fs.existsSync(projectRoot, 'electron')) {
    await build({
      entryPoints: [preloadSrc],
      outfile: path.join(outDir, 'preload.cjs'),
      bundle: true,
      platform: 'node',
      format: 'cjs',
      minify: true,
      sourcemap: false,
      logLevel: 'silent',
      external: ['electron', 'fs', 'path', 'node:fs', 'node:path'],
    });
    // Avoid obfuscating preload for stability
  }

  // Bundle services (ESM)
  const services = ['file-downloader.js', 'settings-store.js', 'window-manager.js', 'deeplink-handler.js', 'auto-updater.js', 'mods-utils.js', 'register-ipc-handlers.js'];
  for (const s of services) {
    const src = path.join(projectRoot, 'js', 'services', s);
    if (!fs.existsSync(src)) continue;
    const out = path.join(outDir, 'services', s);
    await build({
      entryPoints: [src],
      outfile: out,
      bundle: true,
      platform: 'node',
      format: 'esm',
      minify: true,
      sourcemap: false,
      logLevel: 'silent',
      external: ['electron', 'fs', 'path', 'node:fs', 'node:path', 'https', 'node:https', 'child_process', 'node:child_process'],
    });
    // Avoid obfuscating services to preserve ESM exports
  }

  // Bundle handlers (ESM)
  const handlers = ['app-handlers.js', 'dialog-handlers.js', 'download-handlers.js', 'game-handlers.js', 'mods-handlers.js', 'network-handlers.js', 'protocol-handlers.js', 'updater-handlers.js', 'video-handlers.js', 'permissions-handlers.js', 'window-handlers.js'];
  for (const h of handlers) {
    const src = path.join(projectRoot, 'js', 'services', 'handlers', h);
    if (!fs.existsSync(src)) continue;
    const out = path.join(outDir, 'services', 'handlers', h);
    await build({
      entryPoints: [src],
      outfile: out,
      bundle: true,
      platform: 'node',
      format: 'esm',
      minify: true,
      sourcemap: false,
      logLevel: 'silent',
      external: ['electron', 'fs', 'path', 'node:fs', 'node:path', 'https', 'node:https', 'child_process', 'node:child_process', 'os', 'node:os'],
    });
  }
})();
