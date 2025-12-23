# Contributing to R5Valkyrie Launcher

Thank you for your interest in contributing! This guide will help you get started with development, building, and releasing the launcher.

> 💡 **Quick Navigation:** [Setup](#development-setup) | [Development](#development) | [Building](#building) | [Releases](#release-process) | [CI/CD](#automated-cicd-pipeline)

---

## Development Setup

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18 or later
- **npm** 9 or later
- **Git** for version control
- **Code Editor** (VS Code recommended)

### Getting Started

1. **Fork and clone the repository**

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/launcher.git
cd launcher

# Add upstream remote
git remote add upstream https://github.com/r5valkyrie/launcher.git
```

2. **Install dependencies**

```bash
npm install
```

3. **Verify installation**

```bash
# This should start the dev server
npm run dev
```

---

## Development

### Running the Development Server

```bash
# Start full development environment (Astro + Electron)
npm run dev
```

This will:
- ✅ Start Astro dev server on `http://localhost:4321`
- ✅ Launch Electron window pointing to the dev server
- ✅ Enable hot module replacement (HMR) for instant updates
- ✅ Watch for file changes in both frontend and Electron code

### Web-Only Development

For frontend development without Electron:

```bash
npm run web
```

This is faster and useful when working only on UI components.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Full development environment (Astro + Electron) |
| `npm run web` | Web-only development (Astro only, no Electron) |
| `npm run build:web` | Build web assets for production |
| `npm run build` | Create production build with platform packages |
| `npm run build:pacman` | Build Arch Linux package (requires Arch or Docker) |
| `npm run version:patch` | Bump patch version and trigger release |
| `npm run version:minor` | Bump minor version and trigger release |
| `npm run version:major` | Bump major version and trigger release |

### Project Structure

```
launcher/
├── src/                      # Frontend source code
│   ├── components/          # React components
│   │   ├── LauncherUI.tsx   # Main launcher interface
│   │   ├── common/          # Shared utilities
│   │   ├── modals/          # Modal dialogs
│   │   ├── panels/          # Main UI panels
│   │   └── ui/              # UI elements
│   ├── pages/               # Astro pages
│   └── styles/              # Global styles
├── js/                       # Electron source code
│   ├── main.js              # Main process entry
│   ├── preload.cjs          # Preload script (IPC bridge)
│   └── services/            # Backend services
├── electron/                 # Built Electron code (generated)
├── scripts/                  # Build and automation scripts
├── public/                   # Static assets
└── build/                    # Build resources (icons, etc.)
```

### Making Changes

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Edit files in `src/` for frontend changes
   - Edit files in `js/` for Electron/backend changes

3. **Test your changes**

```bash
npm run dev
```

4. **Commit your changes**

```bash
git add .
git commit -m "feat: add your feature description"
```

Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

5. **Push and create pull request**

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

---

## Building

### Local Development Builds

Build the application locally for testing:

```bash
# Build web assets only (fast)
npm run build:web

# Build complete application with installer (slow)
npm run build
```

**Platform-specific builds:**

| Platform | Command | Output |
|----------|---------|--------|
| Windows | `npm run build` | NSIS installer in `release/` |
| Linux (Debian) | `npm run build` | `.deb` package in `release/` |
| Linux (AppImage) | `npm run build` | `.AppImage` in `release/` |
| Linux (Arch) | `npm run build:pacman` | `.pkg.tar.zst` in `release/` |

**Note:** Arch builds require Docker or an Arch Linux system.

### Build Output

All build artifacts are placed in the `release/` directory:
- Installers and packages
- Update metadata files (`latest.yml`, `latest-linux.yml`)
- SHA256 checksums

---

## Release Process

### Creating a New Release

The easiest way to create a release is using the version bump commands:

```bash
# For bug fixes (0.9.40 → 0.9.41)
npm run version:patch

# For new features (0.9.40 → 0.10.0)
npm run version:minor

# For breaking changes (0.9.40 → 1.0.0)
npm run version:major
```

### What Happens Automatically

When you run a version command:

1. ✅ **Updates version** in `package.json`, `manifest.json`, and `flake.nix`
2. ✅ **Commits changes** with message "chore: release vX.X.X"
3. ✅ **Creates git tag** (e.g., `v0.9.41`)
4. ✅ **Pushes to GitHub** (commits and tags)
5. ✅ **Triggers CI/CD** - Automated builds start immediately

**Note:** Linux packages must be built through CI/CD.

---

## Automated CI/CD Pipeline

When you push a version tag, GitHub Actions automatically builds packages for all platforms.

### Build Pipeline Overview

```
Version Tag Pushed (v0.9.41)
    ↓
Six Parallel Build Jobs
    ├─ Windows (NSIS installer)
    ├─ AppImage (portable)
    ├─ Debian (.deb)
    ├─ RPM (.rpm)
    ├─ Tarball (.tar.gz)
    └─ Arch (.pkg.tar.zst)
    ↓
Release Job (combines all)
    ├─ Create GitHub release
    ├─ Upload all packages
    ├─ Generate SHA256SUMS
    └─ Send Discord notification
    ↓
Post-Release Jobs
    ├─ Update AUR package
    └─ Update DEB/RPM repositories
```

### Build Jobs Details

| Job | Platform | Output |
|-----|----------|--------|
| **build-windows** | Windows Server | `R5Valkyrie Launcher Setup X.X.X.exe` |
| **build-appimage** | Ubuntu | `R5Valkyrie.Launcher-X.X.X.AppImage` |
| **build-debian** | Ubuntu | `R5Valkyrie.Launcher-X.X.X-Debian.deb` |
| **build-rpm** | Ubuntu | `R5Valkyrie.Launcher-X.X.X.rpm` |
| **build-tarball** | Ubuntu | `R5Valkyrie.Launcher-X.X.X.tar.gz` |
| **build-arch** | Ubuntu + Docker | `R5Valkyrie.Launcher-X.X.X-Arch.pkg.tar.zst` |

### Release Artifacts

Each release includes:
- ✅ Platform installers/packages
- ✅ SHA256SUMS verification file
- ✅ Update metadata (`latest.yml`, `latest-linux.yml`)
- ✅ `manifest.json` with version info
- ✅ Automated changelog from git commits

---

## Discord Release Notifications

### Setting Up Notifications

To receive Discord notifications when releases complete:

1. **Create a Discord webhook**
   - Open your Discord server
   - Go to: Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Name it (e.g., "Release Bot")
   - Copy the webhook URL

2. **Add webhook to GitHub**
   - Go to repository: Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: Paste your webhook URL
   - Click "Add secret"

3. **Test it**
   ```bash
   npm run version:patch
   ```

The Discord notification will include:
- 📦 Release version and changelog
- 🪟 Installation instructions for each platform
- 🔗 Links to download pages
- 📝 Quick install commands

---

## Code Guidelines

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Use meaningful variable/function names
- Add comments for complex logic

### Frontend (React/Astro)

- Components in `src/components/`
- Use functional components with hooks
- Keep components focused and reusable
- Use Tailwind CSS for styling

### Backend (Electron)

- Main process code in `js/`
- Use IPC for renderer ↔ main communication
- Handle errors gracefully
- Log important operations

### Code Minification

The Electron main process is automatically minified during build for:
- Reduced file size
- Faster load times
- Basic code protection

Configuration is in `scripts/bundleElectron.cjs`.

---

## Testing

Before submitting a pull request:

1. ✅ Test the dev server: `npm run dev`
2. ✅ Test a production build: `npm run build`
3. ✅ Test on your target platform
4. ✅ Verify no console errors
5. ✅ Check that existing features still work

---

## Getting Help

Need assistance?

- 💬 [Open a discussion](https://github.com/r5valkyrie/launcher/discussions) - For questions and ideas
- 🐛 [Report an issue](https://github.com/r5valkyrie/launcher/issues) - For bugs and problems
- 📖 [Read the docs](README.md) - For general information

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**[← Back to README](README.md)**
- Check existing [discussions](https://github.com/r5valkyrie/launcher/discussions)
