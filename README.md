# R5Valkyrie Launcher

A modern game launcher for R5Valkyrie built with Electron, Astro, and React.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Download System](#download-system)
- [Auto-Updates](#auto-updates)
- [Deep Links](#deep-links)
- [License](#license)

## Features

- **Multi-channel support**: Manage multiple game channels (PTU, Live, etc.) with independent settings
- **High-performance downloads**: Concurrent multipart downloads with configurable parallelism
- **Integrity verification**: SHA256 checksum validation with automatic repair for corrupted files
- **Mod management**: Browse, install, update, and manage mods from Thunderstore
- **Launch configuration**: Extensive launch options including resolution, networking, and developer settings
- **Auto-updates**: Automatic launcher updates via GitHub Releases
- **Custom install locations**: Per-channel or global custom installation directories
- **HD texture support**: Optional high-resolution texture downloads
- **Background video**: Dynamic background with local caching

## Requirements

- Node.js 18+
- npm 9+
- **Windows**: Windows 10/11
- **Linux**: Ubuntu 20.04+, Debian 11+, Arch Linux, or any modern distribution
  - Wine/Proton for running the Windows game executable
  - UMU launcher (bundled in AppImage/deb/rpm, AUR package dependency)

## Installation

### Windows

Download the latest installer from [Releases](https://github.com/r5valkyrie/launcher/releases/latest):
- `R5Valkyrie Launcher Setup [version].exe` - Standard Windows installer

### Linux

Download the package for your distribution from [Releases](https://github.com/r5valkyrie/launcher/releases/latest):

#### AppImage (Portable - All Distributions)
```bash
# Download the AppImage
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version].AppImage

# Make it executable
chmod +x R5Valkyrie.Launcher-[version].AppImage

# Run it
./R5Valkyrie.Launcher-[version].AppImage
```

#### Debian/Ubuntu (.deb)
```bash
# Download and install
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version].deb
sudo dpkg -i R5Valkyrie.Launcher-[version].deb

# Install dependencies if needed
sudo apt-get install -f
```

#### Fedora/RHEL/openSUSE (.rpm)
```bash
# Download the package
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version].rpm

# Install with dnf (Fedora/RHEL)
sudo dnf install R5Valkyrie.Launcher-[version].rpm

# Or with zypper (openSUSE)
sudo zypper install R5Valkyrie.Launcher-[version].rpm
```

#### Arch Linux (AUR)
```bash
# Install from AUR using your preferred AUR helper
yay -S r5valkyrie-launcher-bin
# or
paru -S r5valkyrie-launcher-bin

# Or manually
git clone https://aur.archlinux.org/r5valkyrie-launcher-bin.git
cd r5valkyrie-launcher-bin
makepkg -si
```

#### Arch Linux (.pkg.tar.zst)
```bash
# Download the package
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version]-Arch.pkg.tar.zst

# Install with pacman (will automatically install umu-launcher dependency)
sudo pacman -U R5Valkyrie.Launcher-[version]-Arch.pkg.tar.zst
```

**Note:** The Arch package depends on `umu-launcher` from the AUR, which will be installed automatically if you use an AUR helper, or you can install it manually first:
```bash
yay -S umu-launcher  # or paru, or any AUR helper
```

#### Generic Linux (tar.gz)
```bash
# Download and extract
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version].tar.gz
tar -xzf R5Valkyrie.Launcher-[version].tar.gz
cd r5valkyrie-launcher

# Run the launcher
./r5vlauncher
```

#### Verification
All releases include a `SHA256SUMS` file for package verification:
```bash
# Download checksums
wget https://github.com/r5valkyrie/launcher/releases/latest/download/SHA256SUMS

# Verify your download
sha256sum -c SHA256SUMS --ignore-missing
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/r5valkyrie/launcher.git
cd launcher

# Install dependencies
npm install
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Start web-only development (no Electron)
npm run web
```

The development server runs Astro on `http://localhost:4321` and launches Electron pointing to that URL.

## Building

### Local Development Builds

```bash
# Build web assets only
npm run build:web

# Build for production (creates packages in ./release)
npm run build

# Platform-specific local builds
npm run build           # Creates AppImage and Debian package (Linux)
npm run build           # Creates NSIS installer (Windows)
npm run build:pacman    # Creates Arch package (requires Arch Linux or Docker)
```

### Version Management & Releases

The recommended workflow for releases is to use the version bump commands, which automatically handle tagging and triggering CI/CD:

```bash
# Bump version, create tag, push, and trigger automated builds
npm run version:patch   # 0.9.40 -> 0.9.41 (bug fixes)
npm run version:minor   # 0.9.40 -> 0.10.0 (new features)
npm run version:major   # 0.9.40 -> 1.0.0 (breaking changes)
```

**What happens when you run a version command:**
1. Updates version in `package.json` and `manifest.json`
2. Commits the version bump
3. Creates a git tag (e.g., `v0.9.41`)
4. Pushes commits and tags to GitHub
5. Triggers the GitHub Actions workflow to build all platforms

### Manual Release (Advanced)

If you need to publish manually:

```bash
# Windows only (requires GH_TOKEN in .env)
npm run release

# Note: Linux packages are built via CI/CD only
```

### Automated CI/CD Pipeline

When a version tag is pushed (e.g., `v0.9.41`), GitHub Actions automatically builds all platform packages in parallel:

**Four Parallel Build Jobs:**

1. **build-windows** (`windows-latest`)
   - Bundles Electron app
   - Creates NSIS installer
   - Output: `R5Valkyrie Launcher Setup X.X.X.exe`
   - Includes: `latest.yml`, `manifest.json`

2. **build-appimage** (`ubuntu-latest`)
   - Downloads UMU launcher
   - Bundles Electron app
   - Creates portable AppImage
   - Output: `R5Valkyrie Launcher-X.X.X-Portable.AppImage`
   - Includes: `latest-linux.yml`

3. **build-debian** (`ubuntu-latest`)
   - Downloads UMU launcher
   - Bundles Electron app
   - Creates Debian package
   - Output: `R5Valkyrie Launcher-X.X.X-Debian.deb`

4. **build-arch** (`ubuntu-latest` + Arch Docker)
   - Downloads UMU launcher
   - Bundles Electron app
   - Builds in Arch Linux container with `makepkg`
   - Output: `R5Valkyrie Launcher-X.X.X-Arch.pkg.tar.zst`

**Release Job:**
- Waits for all four builds to complete
- Downloads all artifacts
- Creates a single GitHub release in `r5valkyrie/launcher`
- Includes all platform packages in one release:
  - Windows installer
  - Linux AppImage (portable)
  - Debian package
  - Arch package
  - Manifest file

Build artifacts are placed in the `release/` directory.

### Discord Release Notifications

GitHub Actions automatically sends a Discord webhook notification when a release completes, with download links for all platform packages.

**Setup:**

1. Create a Discord webhook in your server:
   - Server Settings → Integrations → Webhooks → New Webhook
   - Copy the webhook URL

2. Add it as a repository secret:
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: Your webhook URL

3. Push a version tag to trigger a release:
   ```bash
   npm run version:patch
   ``

The notification is sent after all builds complete and the GitHub release is published.

## Configuration

The launcher fetches configuration from a remote endpoint at startup. Default:
`https://playvalkyrie.org/api/client/launcherConfig`

### Config Schema

```json
{
  "backgroundVideo": "shortshowcr5v.mp4",
  "channels": [
    {
      "name": "LIVE",
      "game_url": "https://blaze.playvalkyrie.org/ptu_game",
      "dedi_url": "https://blaze.playvalkyrie.org/dedi_game/server_LIVE_v2.9-251129.7z",
      "enabled": true,
      "requires_key": false,
      "allow_updates": true
    },
    {
      "name": "INDEV",
      "game_url": "https://blaze.playvalkyrie.org/ptu_game",
      "dedi_url": "https://blaze.playvalkyrie.org/dedi_game/server_INDEV_v3.0-251130.7z",
      "enabled": false,
      "requires_key": true,
      "allow_updates": true
    }
  ]
}
```

### Top-Level Properties

| Property | Type | Description |
|----------|------|-------------|
| `backgroundVideo` | string | Filename for the banner background video (loaded from CDN) |
| `channels` | array | List of available game channels |

### Channel Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Channel display name and unique identifier (e.g., "LIVE", "INDEV") |
| `game_url` | string | Base URL for game files, must contain `checksums.json` |
| `dedi_url` | string | Direct download URL for the dedicated server archive |
| `enabled` | boolean | Whether the channel is visible and selectable in the launcher |
| `requires_key` | boolean | Whether the channel requires an access key (reserved) |
| `allow_updates` | boolean | Whether the channel can receive game updates |

## Architecture

The launcher follows a modern web-first architecture using Astro, React, and Electron:

```
src/                                    # Frontend source (Astro + React)
├── components/
│   ├── LauncherUI.tsx                  # Main application container
│   ├── common/                         # Shared utilities
│   │   ├── animations.ts               # UI animations (anime.js)
│   │   ├── launchUtils.ts              # Game launch parameter building
│   │   ├── modUtils.ts                 # Mod management helpers
│   │   └── utils.ts                    # General utilities
│   ├── modals/                         # Modal dialogs
│   │   ├── ConfirmModal.tsx            # Generic confirmation dialog
│   │   ├── DependencyModal.tsx         # Mod dependency conflicts
│   │   ├── EulaModal.tsx               # EULA acceptance
│   │   ├── FailedDownloadsModal.tsx    # Download error display
│   │   ├── InstallPromptModal.tsx      # Installation confirmation
│   │   ├── ModDetailsModal.tsx         # Mod information viewer
│   │   ├── ModProfilesModal.tsx        # Mod profile management
│   │   ├── ModQueueModal.tsx           # Download queue manager
│   │   ├── NewsModal.tsx               # Patch notes viewer
│   │   ├── PermissionPromptModal.tsx   # File access permissions
│   │   ├── ServerJoinModPromptModal.tsx # Server-required mods
│   │   ├── ServerModProfileModal.tsx   # Server mod profiles
│   │   ├── ToastNotification.tsx       # Toast notification system
│   │   ├── UpdateModal.tsx             # Game update prompt
│   │   └── UpdaterModal.tsx            # Launcher update progress
│   ├── panels/                         # Main content panels
│   │   ├── LaunchOptionsPanel.tsx      # Game launch configuration
│   │   ├── ModsPanel.tsx               # Mod browser and manager
│   │   ├── NewsPanel.tsx               # News and announcements
│   │   ├── ServerBrowserPanel.tsx      # Multiplayer server list
│   │   └── SettingsPanel.tsx           # Launcher settings
│   └── ui/                             # Reusable UI components
│       ├── HeroBanner.tsx              # Background video player
│       ├── ListItemWrapper.tsx         # List item container
│       ├── PageTransition.tsx          # Page transition effects
│       └── SnowEffect.tsx              # Particle effect overlay
├── pages/
│   └── index.astro                     # Application entry point
└── styles/
    └── global.css                      # Global styles (Tailwind + DaisyUI)

js/                                     # Electron source (pre-bundle)
├── main.js                             # Main process (window management)
├── preload.cjs                         # Context bridge (IPC)
└── services/
    ├── downloader.js                   # Download manager (multipart, verification)
    └── store.js                        # Settings persistence (electron-store)

electron/                               # Bundled Electron code (build output)

scripts/                                # Build and automation scripts
├── afterPack.cjs                       # Post-build processing
├── buildPacman.cjs                     # Arch Linux package builder
├── bundleElectron.cjs                  # Electron bundler
├── downloadUmu.cjs                     # UMU launcher downloader (Linux)
├── installer.nsh                       # NSIS installer customization
├── renameArtifacts.cjs                 # Artifact renaming
└── syncVersion.cjs                     # Version synchronization

bin/                                    # Bundled binaries (Linux only)
└── linux/
    ├── umu-run                         # UMU launcher executable
    └── umu_run.py                      # UMU launcher script
```

### Technology Stack

**Frontend:**
- **Astro** - Static site generation and build tooling
- **React** - UI component framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library for Tailwind
- **Anime.js** - Animation library

**Backend (Electron):**
- **Electron** - Desktop application framework
- **Node.js** - JavaScript runtime
- **electron-builder** - Application packaging
- **electron-updater** - Auto-update system
- **electron-store** - Settings persistence

**Build Tools:**
- **npm scripts** - Task automation
- **GitHub Actions** - CI/CD pipeline
- **Docker** - Arch Linux containerized builds

## Download System

### Checksums Format

The launcher expects a `checksums.json` file at each channel's `game_url`:

```json
{
  "game_version": "2.9.2-live.251129",
  "blog_slug": "playtest-patch-notes",
  "languages": [],
  "files": [
    {
      "path": "r5apex.exe",
      "size": 123456789,
      "checksum": "2f7273a8b8f67807c9a485bbc3c3f1340c17e940afa4e21e71869b0a48674a28",
      "parts": []
    },
    {
      "path": "paks\\Win64\\mp_rr_arena_skygarden.opt.starpak",
      "size": 2275834152,
      "checksum": "1293dfc43b1b4816e2c946a6c8f60026dce2c3441ef63cb5a37fa29d2fe12eea",
      "optional": true,
      "parts": [
        {
          "path": "paks\\Win64\\mp_rr_arena_skygarden.opt.starpak.p0",
          "checksum": "ec4d157634a68a7370c339beb9fae00091415537fd39c24beb4b563bdb3e14ec",
          "size": 513802240
        },
        {
          "path": "paks\\Win64\\mp_rr_arena_skygarden.opt.starpak.p1",
          "checksum": "13d09b5f6ae9c5e19773dc0f53ed5f133943acfd00ef8dfc0dd8c0745631c5af",
          "size": 513802240
        }
      ]
    }
  ]
}
```

### Checksums Properties

| Property | Type | Description |
|----------|------|-------------|
| `game_version` | string | Version identifier for the game build |
| `blog_slug` | string | Associated blog post slug for patch notes |
| `languages` | array | Available language packs |
| `files` | array | List of all game files |

### File Entry Properties

| Property | Type | Description |
|----------|------|-------------|
| `path` | string | Relative file path (uses backslashes on Windows) |
| `size` | number | File size in bytes |
| `checksum` | string | SHA256 hash of the complete file |
| `optional` | boolean | If true, file is only downloaded when HD textures are enabled |
| `parts` | array | Empty array for single files, or array of part objects for multipart files |

### Part Properties (for multipart files)

| Property | Type | Description |
|----------|------|-------------|
| `path` | string | Part file path (original path with `.p0`, `.p1`, etc. suffix) |
| `checksum` | string | SHA256 hash of this part |
| `size` | number | Part size in bytes |

### Download Modes

- **Install**: Downloads all required files, optionally including HD textures
- **Update**: Verifies existing files, downloads only changed/missing files
- **Repair**: Full verification pass with re-download of corrupted files

### Multipart Downloads

Large files can be split into parts for parallel downloading:
- Parts are downloaded concurrently
- Each part is verified independently
- Failed parts retry once before marking as failed
- Parts are merged after all complete verification

### Performance Tuning

Settings panel provides presets:
- **Speed**: Higher concurrency (12 files, 8 parts)
- **Stability**: Lower concurrency (4 files, 3 parts)
- **Default**: Balanced (
- **Windows**: [r5valkyrie/launcher_releases](https://github.com/r5valkyrie/launcher_releases)
- **Linux**: [r5valkyrie/launcher_linux_releases](https://github.com/r5valkyrie/launcher_linux_releases)

### Required Release Assets

Each release must include:

**Windows Release**:
- `latest.yml` - Update metadata
- `R5Valkyrie Launcher Setup X.X.X.exe` - NSIS installer
- `manifest.json` - Version manifest

**Linux Release**:
- `latest-linux.yml` - Update metadata
- `R5Valkyrie Launcher-X.X.X-Portable.AppImage` - Portable AppImage
- `R5Valkyrie Launcher-X.X.X-Debian.deb` - Debian package
- `R5Valkyrie Launcher-X.X.X-Arch.pkg.tar.zst` - Arch Linux package

### Environment Variables

For publishing releases, set in `.env`:
```
GH_TOKEN=your_github_token
```

## Deep Links

The launcher registers the `r5v://` protocol for deep linking.

### Supported Actions

```
r5v://mod/install?name=ModName&version=1.0.0
r5v://mod/install?downloadUrl=https://...
```

## Settings Storage

User settings are stored in:
```
%APPDATA%/r5vlauncher/settings.json
```

### Persisted Settings

- Installation directories (global and per-channel)
- Download performance settings
- Launch options per channel
- UI preferences (video, snow effect, mod filters)
- EULA acceptance version

## Default Paths

### Windows

- **Launcher installation**: `%LOCALAPPDATA%\Programs\r5vlauncher`
- **Game installation**: `%LOCALAPPDATA%\Programs\R5VLibrary\<channel>`
- **Settings**: `%APPDATA%\r5vlauncher\settings.json`
- **Video cache**: `%APPDATA%\r5vlauncher\video_cache\`

### Linux

- **Launcher installation**: 
  - AppImage: Wherever you place the `.AppImage` file
  - Debian: `/opt/R5Valkyrie Launcher`
  - Arch: `/opt/R5Valkyrie Launcher`
- **Game installation**: `~/.local/share/R5VLibrary/<channel>`
- **Settings**: `~/.config/r5vlauncher/settings.json`
- **Video cache**: `~/.config/r5vlauncher/video_cache/`
- **UMU launcher**: Bundled within the application directory

## License

See [LICENSE](LICENSE) for details.
