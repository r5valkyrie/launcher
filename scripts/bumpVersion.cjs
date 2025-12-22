const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const type = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: node bumpVersion.cjs [patch|minor|major]');
  process.exit(1);
}

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // Bump version without git tag
  run(`npm version ${type} --no-git-tag-version`);
  
  // Sync version to manifest.json
  run('node scripts/syncVersion.cjs');
  
  // Read the new version
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const version = pkg.version;
  
  console.log(`\nBumped to version ${version}\n`);
  
  // Update flake.nix version
  const flakePath = path.join(__dirname, '..', 'flake.nix');
  if (fs.existsSync(flakePath)) {
    let flakeContent = fs.readFileSync(flakePath, 'utf8');
    flakeContent = flakeContent.replace(
      /version = "[^"]+";/,
      `version = "${version}";`
    );
    fs.writeFileSync(flakePath, flakeContent, 'utf8');
    console.log(`Updated flake.nix to version ${version}`);
  }
  
  // Git operations
  run('git add package.json package-lock.json manifest.json flake.nix');
  run(`git commit -m "chore: release v${version}"`);
  run(`git tag -a v${version} -m "Release v${version}"`);
  run('git push --follow-tags');
  
  console.log(`\n✓ Successfully bumped and pushed version ${version}`);
} catch (error) {
  console.error('Error during version bump:', error.message);
  process.exit(1);
}
