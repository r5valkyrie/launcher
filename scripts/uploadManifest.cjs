const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Upload manifest.json to the latest GitHub release
 * This runs after electron-builder publishes the release
 */
async function uploadManifestToRelease() {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const packagePath = path.join(__dirname, '..', 'package.json');
  const envPath = path.join(__dirname, '..', '.env');
  
  // Load .env file manually
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
  
  // Read package.json to get version
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const version = pkg.version;
  
  // Read manifest.json
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  
  // Get GitHub token from environment
  const token = process.env.GH_TOKEN;
  if (!token) {
    console.error('⚠️  GH_TOKEN not found in .env file. Skipping manifest upload.');
    console.error('   The manifest.json needs to be manually uploaded to the GitHub release.');
    console.error('   Make sure your .env file contains: GH_TOKEN=your_token_here');
    return;
  }
  
  console.log(`📦 Uploading manifest.json to GitHub release v${version}...`);
  
  try {
    // Get the release by tag (with retry for draft releases)
    let releaseInfo;
    let retries = 5;
    while (retries > 0) {
      try {
        releaseInfo = await githubApiRequest(
          'GET',
          `/repos/r5valkyrie/launcher_releases/releases/tags/v${version}`,
          token
        );
        break;
      } catch (err) {
        if (retries === 1) throw err;
        console.log(`   Waiting for release to be created... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
      }
    }
    
    const uploadUrl = releaseInfo.upload_url.replace('{?name,label}', '');
    
    // Upload the manifest as an asset
    await uploadAsset(uploadUrl, token, 'manifest.json', manifestContent);
    
    console.log('✓ Successfully uploaded manifest.json to GitHub release!');
    console.log(`   Release: https://github.com/r5valkyrie/launcher_releases/releases/tag/v${version}`);
  } catch (error) {
    console.error('❌ Failed to upload manifest.json:', error.message);
    console.error('   Please manually upload manifest.json to the GitHub release.');
    console.error(`   https://github.com/r5valkyrie/launcher_releases/releases/tag/v${version}`);
  }
}

function githubApiRequest(method, path, token, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'R5Valkyrie-Launcher-Builder',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

function uploadAsset(uploadUrl, token, filename, content) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${uploadUrl}?name=${filename}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'User-Agent': 'R5Valkyrie-Launcher-Builder',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(content)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`Upload failed: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

// Run the upload
uploadManifestToRelease().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});

