const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

// Read manifest.json
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

// Update manifest version to match package.json
manifest.version = packageJson.version;

// Write back to manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4) + '\n', 'utf-8');

console.log(`✓ Synced version ${packageJson.version} to manifest.json`);

