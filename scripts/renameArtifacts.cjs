/* eslint-disable */
const fs = require('fs');
const path = require('path');

/**
 * Renames Linux build artifacts to more descriptive names
 * Called via afterAllArtifactBuild hook in electron-builder
 */
exports.default = async function(context) {
  const { outDir, platformToTargets } = context;
  
  // Only process Linux builds
  if (!platformToTargets.has('linux')) {
    return;
  }
  
  const releaseDir = path.resolve(outDir);
  console.log('Renaming Linux artifacts in:', releaseDir);
  
  try {
    const files = fs.readdirSync(releaseDir);
    const version = context.packager.appInfo.version;
    const productName = context.packager.appInfo.productName;
    
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
  }
};
