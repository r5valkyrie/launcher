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
  const services = ['downloader.js', 'store.js', 'window.js', 'deeplink.js', 'updater.js', 'mods.js', 'game.js', 'ipc-handlers.js', 'protocol.js'];
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
})();
