const fs = require('fs');
const path = require('path');

/**
 * After all artifacts are built, copy manifest.json to the release folder
 * so it gets uploaded as a GitHub release asset
 */
exports.default = async function(context) {
  const { outDir } = context;
  const manifestSource = path.join(__dirname, '..', 'manifest.json');
  const manifestDest = path.join(outDir, 'manifest.json');
  
  try {
    // Copy manifest.json to release folder
    fs.copyFileSync(manifestSource, manifestDest);
    console.log('✓ Copied manifest.json to release folder');
  } catch (error) {
    console.error('Failed to copy manifest.json:', error);
    throw error;
  }
};

