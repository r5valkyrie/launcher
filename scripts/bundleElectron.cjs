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
  ensureDir(path.join(outDir, 'modules'));

  // Common external modules for Node.js
  const nodeExternals = [
    'electron',
    'fs', 'node:fs',
    'path', 'node:path',
    'https', 'node:https',
    'http', 'node:http',
    'child_process', 'node:child_process',
    'os', 'node:os',
    'zlib', 'node:zlib',
    'crypto', 'node:crypto',
    'stream', 'node:stream',
    'util', 'node:util',
    'url', 'node:url',
    'module', 'node:module',
  ];

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
    external: nodeExternals,
  });
  // Avoid obfuscating main to keep Node/Electron semantics intact

  // Bundle preload (CJS maintained if needed)
  const preloadSrc = path.join(projectRoot, 'js', 'preload.cjs');
  if (fs.existsSync(preloadSrc)) {
    await build({
      entryPoints: [preloadSrc],
      outfile: path.join(outDir, 'preload.cjs'),
      bundle: true,
      platform: 'node',
      format: 'cjs',
      minify: true,
      sourcemap: false,
      logLevel: 'silent',
      external: nodeExternals,
    });
    // Avoid obfuscating preload for stability
  }

  // Bundle services (ESM)
  const services = ['downloader.js', 'store.js'];
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
      external: nodeExternals,
    });
  }

  // Bundle modules (ESM)
  const modules = [
    'window.js',
    'deeplinks.js', 
    'updater.js',
    'mods.js',
    'downloads.js',
    'game.js',
    'permissions.js',
    'protocols.js',
    'ipc-handlers.js'
  ];
  for (const m of modules) {
    const src = path.join(projectRoot, 'js', 'modules', m);
    if (!fs.existsSync(src)) continue;
    const out = path.join(outDir, 'modules', m);
    await build({
      entryPoints: [src],
      outfile: out,
      bundle: true,
      platform: 'node',
      format: 'esm',
      minify: true,
      sourcemap: false,
      logLevel: 'silent',
      external: nodeExternals,
    });
  }

  console.log('✅ Bundled main.js, preload.cjs, services, and modules successfully');
})();