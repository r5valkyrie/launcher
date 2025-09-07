/* eslint-disable */
const path = require('path');
const fs = require('fs');

module.exports = async function beforePack(/* context */) {
  const bytenode = require('bytenode');
  let esbuild;
  try { esbuild = require('esbuild'); } catch { esbuild = null; }

  const projectRoot = process.cwd();
  const electronDir = path.join(projectRoot, 'electron');

  const targets = [
    path.join(electronDir, 'services', 'downloader.js'),
    path.join(electronDir, 'services', 'store.js'),
  ];

  const exportMap = {
    downloader: ['fetchChecksums', 'downloadAll', 'createCancelToken', 'cancelToken'],
    store: ['getSetting', 'setSetting', 'getAllSettings'],
  };

  for (const file of targets) {
    try {
      if (!fs.existsSync(file)) continue;
      let src = fs.readFileSync(file, 'utf-8');
      const dir = path.dirname(file);
      const base = path.basename(file, '.js');
      const outJsc = path.join(dir, `${base}.jsc`);

      // If file is already an ESM wrapper that references .jsc, skip
      if (src.includes("import 'bytenode'") && src.includes("createRequire") && src.includes('.jsc')) continue;

      // If it's an old CJS loader, migrate to ESM wrapper
      if (src.includes("module.exports = require('./") && src.includes('.jsc')) {
        const names = exportMap[base] || [];
        const reexports = names.map((n) => `export const ${n} = mod.${n};`).join('\n');
        const wrapper = `import 'bytenode';\nimport { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\nconst mod = require('./${path.basename(outJsc)}');\n${reexports}\nexport default mod;\n`;
        fs.writeFileSync(file, wrapper, 'utf-8');
        continue;
      }

      const tempCjs = path.join(dir, `${base}.bytenode.cjs`);

      if (esbuild) {
        await esbuild.build({
          entryPoints: [file],
          outfile: tempCjs,
          bundle: true,
          platform: 'node',
          format: 'cjs',
          sourcemap: false,
          external: [],
          logLevel: 'silent',
        });
      } else {
        fs.copyFileSync(file, tempCjs);
      }

      await bytenode.compileFile({ filename: tempCjs, output: outJsc });

      const names = exportMap[base] || [];
      const reexports = names.map((n) => `export const ${n} = mod.${n};`).join('\n');
      const wrapper = `import 'bytenode';\nimport { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\nconst mod = require('./${path.basename(outJsc)}');\n${reexports}\nexport default mod;\n`;
      fs.writeFileSync(file, wrapper, 'utf-8');

      try { fs.unlinkSync(tempCjs); } catch {}
    } catch (e) {
      console.error('Bytenode compile failed for', file, e);
    }
  }
};
