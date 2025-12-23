# Technical Architecture

> **Deep dive into the R5Valkyrie Launcher's technical implementation, structure, and configuration system.**

---

## 📁 Project Structure

```
launcher/
├── src/                    # Astro/React frontend
│   ├── components/        # React components
│   │   ├── LauncherUI.tsx           # Main launcher interface
│   │   ├── common/                  # Shared utilities and helpers
│   │   ├── modals/                  # Modal dialogs
│   │   ├── panels/                  # Main panel components
│   │   └── ui/                      # UI elements (banners, effects)
│   ├── pages/            # Astro pages
│   │   └── index.astro              # Main entry page
│   └── styles/           # CSS styles
│       └── global.css               # Global styles
├── js/                     # Source Electron code
│   ├── main.js                      # Electron main process
│   ├── preload.cjs                  # Preload script (IPC bridge)
│   └── services/
│       ├── downloader.js            # Download manager (multipart, verification)
│       └── store.js                 # Settings persistence (electron-store)
├── electron/              # Bundled Electron code (build output)
├── scripts/               # Build and automation scripts
│   ├── afterPack.cjs                # Post-build processing
│   ├── buildPacman.cjs              # Arch Linux package builder
│   ├── bundleElectron.cjs           # Electron bundler
│   ├── downloadUmu.cjs              # UMU launcher downloader (Linux)
│   ├── installer.nsh                # NSIS installer customization
│   ├── renameArtifacts.cjs          # Artifact renaming
│   ├── bumpVersion.cjs              # Version management
│   └── syncVersion.cjs              # Version synchronization
└── bin/                   # Bundled binaries (Linux only)
    └── linux/
        ├── umu-run                  # UMU launcher executable
        └── umu_run.py               # UMU launcher script
```

---

## ⚙️ Technology Stack

### Frontend
- **Astro** (v5.13.5) - Static site generation and build tooling
- **React** (v19.1.1) - UI component framework
- **TypeScript** (v5.7.2) - Type-safe JavaScript
- **Tailwind CSS** (v4.1.13) - Utility-first CSS framework
- **DaisyUI** (v5.1.7) - Component library for Tailwind
- **Anime.js** (v3.2.2) - Animation library

### Backend (Electron)
- **Electron** (v33.3.1) - Desktop application framework
- **Node.js** (v20.x) - JavaScript runtime
- **electron-builder** (v26.0.12) - Application packaging
- **electron-updater** (v7.1.3) - Auto-update system
- **electron-store** (v10.0.0) - Settings persistence

### Build & CI/CD
- **npm scripts** - Task automation and workflow orchestration
- **esbuild** (v0.23.0) - Fast JavaScript/TypeScript bundler
- **GitHub Actions** - Multi-platform CI/CD pipeline
- **Docker** - Containerized Arch Linux builds

---

## 🔧 Configuration System

The launcher fetches its configuration from a remote endpoint at startup.

**Default endpoint:** `https://playvalkyrie.org/api/client/launcherConfig`

### Configuration Schema

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

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | ✓ | Display name for the channel (e.g., "LIVE", "PTU") |
| `game_url` | string | ✓ | Base URL for game files and checksums |
| `dedi_url` | string | ✗ | URL for dedicated server download |
| `enabled` | boolean | ✓ | Whether the channel is accessible to users |
| `requires_key` | boolean | ✓ | Requires access key to download/install |
| `allow_updates` | boolean | ✓ | Allows update/repair operations |

---

## 📦 Download System

### Checksums Format

Each game channel must provide a `checksums.json` file at its `game_url` endpoint. This file contains version information and file manifests for verification and downloading.

**Example structure:**

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

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `path` | string | ✓ | Relative file path (uses backslashes on Windows) |
| `size` | number | ✓ | File size in bytes |
| `checksum` | string | ✓ | SHA256 hash of the complete file |
| `optional` | boolean | ✗ | If true, only downloaded when HD textures enabled |
| `parts` | array | ✓ | Empty for single files; array of part objects for multipart |

### Part Properties (for multipart files)

| Property | Type | Description |
|----------|------|-------------|
| `path` | string | Part file path (original path with `.p0`, `.p1`, etc. suffix) |
| `checksum` | string | SHA256 hash of this part |
| `size` | number | Part size in bytes |

### Download Modes

The launcher supports three primary download modes:

| Mode | Purpose | Behavior |
|------|---------|----------|
| **Install** | Fresh installation | Downloads all required files, optionally including HD textures |
| **Update** | Version upgrade | Verifies existing files, downloads only changed/missing files |
| **Repair** | Fix corrupted files | Full verification pass with re-download of corrupted files |

### Multipart Downloads

Large game files are split into smaller parts for improved download reliability and performance.

**How it works:**
1. Large files are split into parts (e.g., `.p0`, `.p1`, `.p2`)
2. Parts are downloaded concurrently for maximum speed
3. Each part is verified independently using SHA256 checksums
4. Failed parts automatically retry once before marking as failed
5. After all parts are verified, they're merged into the final file

### Performance Tuning

The settings panel offers three download performance presets:

| Preset | Concurrent Files | Concurrent Parts | Best For |
|--------|------------------|------------------|----------|
| **Speed** | 12 | 8 | Fast connections, high-end systems |
| **Default** | 8 | 5 | Most users, balanced performance |
| **Stability** | 4 | 3 | Slower connections, stability priority |

---

## 🔄 Auto-Updates

## Auto-Updates

The launcher uses `electron-updater` to automatically check for new versions on startup.

### Update Source

Updates are fetched from **GitHub Releases** at: `r5valkyrie/launcher`

### Required Release Assets

Each release must include the following assets for auto-updates to function:

- **Update metadata:**
  - `latest.yml` (Windows)
  - `latest-linux.yml` (Linux)
- **Application packages:**
  - Windows: `.exe` installer (NSIS)
  - Linux: `.AppImage`, `.deb`, `.rpm`, `.pkg.tar.zst`
- **Version manifest:** `manifest.json`

---

## 🔗 Deep Links

The launcher registers the `r5v://` protocol for deep linking, enabling external websites and applications to interact with the launcher.

### Supported Actions

| Action | Format | Description |
|--------|--------|-------------|
| **Install Mod** | `r5v://mod/install?name=ModName&version=1.0.0` | Install mod by name and version |
| **Install Mod (Direct)** | `r5v://mod/install?downloadUrl=https://...` | Install mod from direct URL |

---

## 💾 Settings Storage

User settings are persisted using `electron-store` in JSON format.

### Storage Locations

| Platform | Path |
|----------|------|
| **Windows** | `%APPDATA%/r5vlauncher/settings.json` |
| **Linux** | `~/.config/r5vlauncher/settings.json` |

### Persisted Settings

The following settings are stored persistently:

- **Installation paths:** Global and per-channel game directories
- **Download settings:** Performance presets, concurrent limits
- **Launch options:** Per-channel launch arguments and configurations
- **UI preferences:** Video playback, visual effects, mod filters
- **EULA acceptance:** Accepted version number
- **Mod profiles:** User-created mod configurations

---

## 📂 Default Paths

### Windows

| Resource | Path |
|----------|------|
| **Launcher installation** | `%LOCALAPPDATA%\Programs\r5vlauncher` |
| **Game installation** | `%LOCALAPPDATA%\Programs\R5VLibrary\<channel>` |
| **Settings** | `%APPDATA%\r5vlauncher\settings.json` |
| **Video cache** | `%APPDATA%\r5vlauncher\video_cache\` |

### Linux

| Resource | Path |
|----------|------|
| **Launcher (AppImage)** | Wherever you place the `.AppImage` file |
| **Launcher (deb/rpm/pkg)** | `/opt/R5Valkyrie Launcher` |
| **Game installation** | `~/.local/share/R5VLibrary/<channel>` |
| **Settings** | `~/.config/r5vlauncher/settings.json` |
| **Video cache** | `~/.config/r5vlauncher/video_cache/` |
| **UMU launcher** | Bundled within application directory |

---

## 🔒 Code Minification

The Electron main process undergoes minification during the build process to reduce file size and improve load times. This is configured in [scripts/bundleElectron.cjs](scripts/bundleElectron.cjs) using esbuild.

**Why minification?**
- Reduces bundle size for faster downloads
- Removes unnecessary whitespace and comments
- Optimizes code structure for better performance

---

## 🏗️ Build System

### Build Scripts

The launcher uses several npm scripts for building and releasing:

| Script | Command | Purpose |
|--------|---------|----------|
| **Build** | `npm run build` | Build frontend and bundle Electron code |
| **Bundle Electron** | `npm run bundle` | Bundle Electron main process with esbuild |
| **Package** | `npm run dist` | Build installer packages for distribution |
| **Version Bump** | `npm run version:patch/minor/major` | Increment version and trigger release |

### CI/CD Pipeline

GitHub Actions builds packages for all platforms on every release:

**Build Jobs:**
1. **Windows** - NSIS installer (`.exe`)
2. **AppImage** - Portable Linux binary
3. **Debian** - `.deb` package for Debian/Ubuntu
4. **RPM** - `.rpm` package for Fedora/openSUSE
5. **Tarball** - `.tar.gz` portable archive
6. **Arch** - `.pkg.tar.zst` package (built in Docker)

**Post-Build:**
- Updates package repositories (Debian, RPM)
- Generates `latest.yml` and `latest-linux.yml` for auto-updates
- Publishes GitHub Release with all artifacts
- Sends Discord webhook notification

---

For development setup and contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Code Obfuscation

The Electron main process is obfuscated using `javascript-obfuscator` during the build to protect game server URLs and API keys. Configuration is in `scripts/bundleElectron.cjs`.
