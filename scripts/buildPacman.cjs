const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const skipUpload = args.includes('--no-upload') || args.includes('-n');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const packageJson = require('../package.json');
const version = packageJson.version;
const releaseDir = path.join(__dirname, '..', 'release');
const unpackedDir = path.join(releaseDir, 'linux-unpacked');
const pkgName = 'r5vlauncher';

// Check if linux-unpacked exists
if (!fs.existsSync(unpackedDir)) {
  console.error('Error: linux-unpacked directory not found. Run the build first.');
  process.exit(1);
}

// Create temp build directory
const tmpDir = path.join(releaseDir, 'pacman-build');
if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true });
}
fs.mkdirSync(tmpDir, { recursive: true });

// Create PKGBUILD
const pkgbuild = `# Maintainer: R5Valkyrie
pkgname=${pkgName}
pkgver=${version}
pkgrel=1
pkgdesc="R5Valkyrie Game Launcher"
arch=('x86_64')
url="https://playvalkyrie.org"
license=('custom')
depends=('gtk3' 'libnotify' 'nss' 'libxss' 'libxtst' 'xdg-utils' 'at-spi2-core' 'util-linux-libs' 'libsecret')
options=('!strip' '!emptydirs')
source=()

package() {
  # Install app files
  install -dm755 "\${pkgdir}/opt/R5Valkyrie Launcher"
  cp -r "\${srcdir}/linux-unpacked/"* "\${pkgdir}/opt/R5Valkyrie Launcher/"
  
  # Install icon
  install -Dm644 "\${srcdir}/icon.png" "\${pkgdir}/usr/share/icons/hicolor/512x512/apps/${pkgName}.png"
  
  # Install desktop file
  install -Dm644 "\${srcdir}/${pkgName}.desktop" "\${pkgdir}/usr/share/applications/${pkgName}.desktop"
  
  # Install binary symlink
  install -dm755 "\${pkgdir}/usr/bin"
  ln -sf "/opt/R5Valkyrie Launcher/r5vlauncher" "\${pkgdir}/usr/bin/${pkgName}"
  
  # Set permissions
  chmod 755 "\${pkgdir}/opt/R5Valkyrie Launcher/r5vlauncher"
  chmod 4755 "\${pkgdir}/opt/R5Valkyrie Launcher/chrome-sandbox" 2>/dev/null || true
}
`;

// Create desktop file
const desktopFile = `[Desktop Entry]
Name=R5Valkyrie Launcher
Comment=R5Valkyrie Game Launcher
Exec="/opt/R5Valkyrie Launcher/r5vlauncher" %U
Terminal=false
Type=Application
Icon=${pkgName}
Categories=Game;
MimeType=x-scheme-handler/r5v;
`;

// Write files
fs.writeFileSync(path.join(tmpDir, 'PKGBUILD'), pkgbuild);
fs.writeFileSync(path.join(tmpDir, `${pkgName}.desktop`), desktopFile);

// Copy required files to srcdir
const srcDir = path.join(tmpDir, 'src');
fs.mkdirSync(srcDir, { recursive: true });

// Copy linux-unpacked
execSync(`cp -r "${unpackedDir}" "${srcDir}/linux-unpacked"`, { stdio: 'inherit' });

// Copy icon
const iconSrc = path.join(__dirname, '..', 'build', 'icon.png');
fs.copyFileSync(iconSrc, path.join(srcDir, 'icon.png'));

// Copy desktop file
fs.copyFileSync(path.join(tmpDir, `${pkgName}.desktop`), path.join(srcDir, `${pkgName}.desktop`));

console.log('Building pacman package...');

try {
  execSync('makepkg -f --nodeps', { 
    cwd: tmpDir, 
    stdio: 'inherit',
    env: { ...process.env, PKGDEST: releaseDir, SRCPKGDEST: tmpDir }
  });
  
  // Find and rename the package
  const files = fs.readdirSync(releaseDir);
  const pkgFile = files.find(f => f.startsWith(pkgName) && f.endsWith('.pkg.tar.zst'));
  if (pkgFile) {
    const newName = `R5Valkyrie Launcher-${version}-Arch.pkg.tar.zst`;
    const newPath = path.join(releaseDir, newName);
    fs.renameSync(path.join(releaseDir, pkgFile), newPath);
    console.log(`\nSuccess! Created: ${newName}`);
    
    // Upload to GitHub if GH_TOKEN is set and --no-upload not specified
    if (skipUpload) {
      console.log('\nSkipping upload (--no-upload specified).');
    } else if (process.env.GH_TOKEN) {
      console.log('\nUploading to GitHub...');
      try {
        const token = process.env.GH_TOKEN;
        const repo = 'r5valkyrie/launcher_linux_releases';
        const tag = `v${version}`;
        const fileName = newName;
        
        // Get release ID (works for drafts too)
        const releaseData = execSync(
          `curl -s -H "Authorization: token ${token}" "https://api.github.com/repos/${repo}/releases"`,
          { encoding: 'utf8' }
        );
        const releases = JSON.parse(releaseData);
        const release = releases.find(r => r.tag_name === tag || r.name === tag || r.name?.includes(version));
        
        if (!release) {
          console.log('Release not found for version', version);
          console.log('Available releases:', releases.map(r => r.tag_name).join(', ') || 'none');
          return;
        }
        
        console.log(`Found release: ${release.name} (${release.draft ? 'draft' : 'published'})`);
        
        // Check if asset already exists and delete it
        const existingAsset = release.assets?.find(a => a.name === fileName);
        if (existingAsset) {
          console.log('Deleting existing asset...');
          execSync(
            `curl -s -X DELETE -H "Authorization: token ${token}" "https://api.github.com/repos/${repo}/releases/assets/${existingAsset.id}"`,
            { encoding: 'utf8' }
          );
        }
        
        // Upload the file
        const uploadUrl = release.upload_url.replace('{?name,label}', '');
        console.log('Uploading...');
        const uploadResult = execSync(
          `curl -s -X POST -H "Authorization: token ${token}" -H "Content-Type: application/octet-stream" --data-binary @"${newPath}" "${uploadUrl}?name=${encodeURIComponent(fileName)}"`,
          { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 }
        );
        
        const uploadJson = JSON.parse(uploadResult);
        if (uploadJson.id) {
          console.log('Upload complete!', uploadJson.browser_download_url);
        } else {
          console.log('Upload response:', uploadResult);
        }
      } catch (uploadErr) {
        console.warn('Failed to upload to GitHub:', uploadErr.message);
      }
    } else {
      console.log('\nGH_TOKEN not set, skipping upload.');
    }
  }
  
  // Cleanup
  fs.rmSync(tmpDir, { recursive: true });
} catch (err) {
  console.error('Failed to build pacman package:', err.message);
  process.exit(1);
}
