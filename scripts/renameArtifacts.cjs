/* eslint-disable */
const fs = require('fs');
const path = require('path');

/**
 * Renames Linux build artifacts to more descriptive names
 * Run after electron-builder completes
 */
const releaseDir = path.resolve(__dirname, '..', 'release');

console.log('Renaming Linux artifacts in:', releaseDir);

if (!fs.existsSync(releaseDir)) {
  console.log('Release directory does not exist, skipping rename');
  process.exit(0);
}

try {
  const files = fs.readdirSync(releaseDir);
  const packageJson = require('../package.json');
  const version = packageJson.version;
  const productName = packageJson.build.productName;
  
  for (const file of files) {
    const filePath = path.join(releaseDir, file);
    
    // Skip directories and yml files
    if (fs.statSync(filePath).isDirectory() || file.endsWith('.yml')) {
      continue;
    }
    
    let newName = null;
    
    // Rename AppImage to portable
    if (file.endsWith('.AppImage')) {
      newName = `${productName}-${version}-portable.AppImage`;
    }
    // Rename deb
    else if (file.endsWith('.deb')) {
      newName = `${productName}-${version}-deb.deb`;
    }
    // Rename tar.gz to arch
    else if (file.endsWith('.tar.gz')) {
      newName = `${productName}-${version}-arch.tar.gz`;
    }
    
    if (newName && newName !== file) {
      const newPath = path.join(releaseDir, newName);
      console.log(`Renaming: ${file} -> ${newName}`);
      fs.renameSync(filePath, newPath);
    }
  }
  
  console.log('Artifact renaming complete');
} catch (error) {
  console.error('Error renaming artifacts:', error);
  process.exit(1);
} finally {
  process.exit(0);
}
