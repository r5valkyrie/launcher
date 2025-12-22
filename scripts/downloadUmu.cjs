#!/usr/bin/env node

// Downloads UMU launcher for bundling with AppImage, deb, and rpm packages.
// Note: Arch Linux (.pkg.tar.zst) packages do NOT bundle UMU - it's a package dependency.
// The launcher automatically detects system-installed UMU at /usr/bin/umu-run first.

const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Exit if not running on Linux
if (os.platform() !== 'linux') {
  console.log('This script only runs on Linux systems.');
  process.exit(0);
}

// Configuration - uses current working directory
const CWD = process.cwd();
const TARGET_DIR = path.join(CWD, 'bin', os.platform());
const VERSION = '1.2.9';
const DOWNLOAD_URL = `https://github.com/Open-Wine-Components/umu-launcher/releases/download/${VERSION}/umu-launcher-${VERSION}-zipapp.tar`;
const TEMP_FILE = path.join(TARGET_DIR, 'umu-temp.tar');

// Create target directory
try {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log(`Created directory: ${TARGET_DIR}`);
} catch (err) {
  console.error('Directory creation failed:', err);
  process.exit(1);
}

// Download file with redirect handling
function downloadFile(url, dest, callback, redirectCount = 0) {
  if (redirectCount > 5) {
    return callback(new Error('Too many redirects'));
  }

  https.get(url, (response) => {
    if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
      downloadFile(response.headers.location, dest, callback, redirectCount + 1);
    } else if (response.statusCode === 200) {
      const fileStream = fs.createWriteStream(dest);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        callback();
      });
    } else {
      callback(new Error(`Download failed with status code: ${response.statusCode}`));
    }
  }).on('error', (err) => {
    callback(err);
  });
}

// Download UMU launcher
console.log('Downloading UMU launcher...');

downloadFile(DOWNLOAD_URL, TEMP_FILE, (err) => {
  if (err) {
    console.error('Download failed:', err);
    try { fs.unlinkSync(TEMP_FILE); } catch {}
    process.exit(1);
  }

  console.log('Download complete');

  
  // Extract the tar file with --strip-components to avoid nested directory
  const { exec } = require('child_process');
  const extractCommand = `tar -xvf "${TEMP_FILE}" --strip-components=1 -C "${TARGET_DIR}"`;
  
  exec(extractCommand, { stdio: 'inherit' }, (err, stdout) => {
    // Clean up temporary file
    try {
      fs.unlinkSync(TEMP_FILE);
      console.log('Removed temporary archive file');
    } catch (cleanupErr) {
      console.warn('Warning: Could not remove temporary file');
    }
    
    if (err) {
      console.error('Extraction failed:', err);
      process.exit(1);
    }
    
    console.log('Extraction completed (files placed directly in bin/linux/)');
    // Force exit since npm scripts sometimes hang with child processes
    process.exit(0);
  });
});
      

