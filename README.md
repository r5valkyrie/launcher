# R5 Valkyrie Launcher

A modern game launcher for R5 Valkyrie built with Electron, Astro, and React.

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
  - UMU launcher (bundled automatically)

## Installation

### Windows

Download the latest installer from [Releases](https://github.com/r5valkyrie/launcher/releases/latest):
- `R5Valkyrie Launcher Setup [version].exe` - Standard Windows installer

### Linux

Download the package for your distribution from [Releases](https://github.com/r5valkyrie/launcher/releases/latest):

#### AppImage (Portable - All Distributions)
```bash
# Download the AppImage
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version]-portable.AppImage

# Make it executable
chmod +x R5Valkyrie.Launcher-[version]-portable.AppImage

# Run it
./R5Valkyrie.Launcher-[version]-portable.AppImage
```

#### Debian/Ubuntu (.deb)
```bash
# Download and install
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version]-deb.deb
sudo dpkg -i R5Valkyrie.Launcher-[version]-deb.deb

# Install dependencies if needed
sudo apt-get install -f
```

#### Arch Linux (.pkg.tar.zst)
```bash
# Download the package
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version].pkg.tar.zst

# Install with pacman
sudo pacman -U R5Valkyrie.Launcher-[version].pkg.tar.zst
```

#### Manual Installation (.tar.gz)
For other distributions or manual installation:
```bash
# Download and extract
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version]-arch.tar.gz
tar -xzf R5Valkyrie.Launcher-[version]-arch.tar.gz

# Move to /opt or your preferred location
sudo mv R5Valkyrie\ Launcher /opt/r5vlauncher

# Run it
/opt/r5vlauncher/r5vlauncher
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

### Build Commands

```bash
# Build for production (creates installer in ./release)
npm run build

# Build and publish to GitHub Releases
npm run release           # Windows only
npm run release:linux     # Linux only (legacy)

# Version bump and auto-release (Windows + Linux)
npm run version:patch   # 0.9.40 -> 0.9.41
npm run version:minor   # 0.9.40 -> 0.10.0
npm run version:major   # 0.9.40 -> 1.0.0
```

### Platform-Specific Builds

**Windows**: Creates NSIS installer (`.exe`)
```bash
npm run build  # or npm run release
```

**Linux**: Creates multiple package formats
```bash
npm run build  # Creates AppImage, .deb, and .tar.gz
```

Build output is placed in the `release/` directory.

### Automated Releases

The project uses GitHub Actions to automatically build both Windows and Linux binaries when you push a version tag:

1. Bump version: `npm run version:patch` (or `minor`/`major`)
2. This automatically creates a tag, pushes it, and triggers the workflow
3. Both Windows and Linux builds are created and uploaded to a GitHub release
4. The `manifest.json` is included for auto-update checking

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

```
src/
├── components/
│   ├── LauncherUI.tsx      # Main application component
│   ├── common/             # Shared utilities
│   │   ├── animations.ts   # UI animations (anime.js)
│   │   ├── launchUtils.ts  # Game launch parameter building
│   │   ├── modUtils.ts     # Mod management helpers
│   │   └── utils.ts        # General utilities
│   ├── modals/             # Modal dialogs
│   ├── panels/             # Tab panels (Settings, Mods, Launch Options, News)
│   └── ui/                 # Reusable UI components
├── pages/
│   └── index.astro         # Entry point
└── styles/
    └── global.css          # Global styles (Tailwind + DaisyUI)

js/                         # Electron source (pre-bundle)
├── main.js                 # Main process
├── preload.cjs             # Context bridge
└── services/
    ├── downloader.js       # Download manager
    └── store.js            # Settings persistence

electron/                   # Bundled Electron code (output)
```

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
- **Default**: Balanced (8 files, 6 parts)

Custom speed limits can be set in bytes per second.

## Auto-Updates

The launcher uses `electron-updater` with GitHub as the update provider.

### Release Repository

Updates are published to: [r5valkyrie/launcher_releases](https://github.com/r5valkyrie/launcher_releases)

### Required Release Assets

Each release must include:
- `latest.yml` - Update metadata
- `R5Valkyrie Launcher Setup X.X.X.exe` - Installer
- `R5Valkyrie Launcher Setup X.X.X.exe.blockmap` - Delta update data

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

- **Launcher installation**: `%LOCALAPPDATA%/Programs/r5vlauncher`
- **Game installation**: `%LOCALAPPDATA%/Programs/R5VLibrary/<channel>`
- **Settings**: `%APPDATA%/r5vlauncher/settings.json`
- **Video cache**: `%APPDATA%/r5vlauncher/video_cache/`

## License

See [LICENSE](LICENSE) for details.
