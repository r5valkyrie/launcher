/* eslint-disable */
const fs = require('fs');
const path = require('path');

module.exports = async function afterPack(context) {
  try {
    const appOutDir = context.appOutDir;
    const locales = path.join(appOutDir, 'locales');
    if (fs.existsSync(locales)) {
      const keep = new Set(['en-US.pak']);
      for (const f of fs.readdirSync(locales)) {
        if (!keep.has(f)) {
          try { fs.unlinkSync(path.join(locales, f)); } catch {}
        }
      }
    }
    // Remove optional GPU fallback libraries to save space (keep if you need software rendering/Vulkan)
    const maybeRemove = [
      'vk_swiftshader_icd.json',
      'vk_swiftshader.dll',
      'swiftshader', // sometimes a folder
    ];
    for (const rel of maybeRemove) {
      const target = path.join(appOutDir, rel);
      try {
        if (fs.existsSync(target)) {
          const stat = fs.statSync(target);
          if (stat.isDirectory()) {
            for (const f of fs.readdirSync(target)) {
              try { fs.unlinkSync(path.join(target, f)); } catch {}
            }
            try { fs.rmdirSync(target); } catch {}
          } else {
            fs.unlinkSync(target);
          }
        }
      } catch {}
    }
  } catch {}
}


