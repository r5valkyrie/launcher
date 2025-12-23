# R5Valkyrie Launcher

A modern game launcher for R5Valkyrie built with Electron, Astro, and React.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Installation Guide](INSTALL.md)** | Install instructions for Windows, Linux (Debian, Fedora, Arch, NixOS), and AppImage |
| **[Contributing Guide](CONTRIBUTING.md)** | Development setup, building, and release process |
| **[Architecture & Configuration](ARCHITECTURE.md)** | Technical details, project structure, and configuration |

---

## ✨ Features

- **Multi-channel support**: Manage multiple game channels (PTU, Live, etc.) with independent settings
- **High-performance downloads**: Concurrent multipart downloads with configurable parallelism
- **Integrity verification**: SHA256 checksum validation with automatic repair for corrupted files
- **Mod management**: Browse, install, update, and manage mods from Thunderstore
- **Launch configuration**: Extensive launch options including resolution, networking, and developer settings
- **Auto-updates**: Automatic launcher updates via GitHub Releases
- **Custom install locations**: Per-channel or global custom installation directories
- **HD texture support**: Optional high-resolution texture downloads
- **Dynamic background**: Background video with local caching

## 📋 Requirements

- **Steam**: Required for running the game in online mode
- **Windows**: Windows 10/11
- **Linux**: Any modern distribution
  - Wine/Proton for running the Windows game executable
  - UMU launcher (bundled in packages, AUR dependency for Arch)

---

## 🚀 Quick Start

### For Users

**Install:** See the [Installation Guide](INSTALL.md) for your platform

**Quick Install Commands:**

```bash
# Debian/Ubuntu
echo 'deb [trusted=yes] https://r5valkyrie.github.io/launcher/deb/ ./' | sudo tee /etc/apt/sources.list.d/r5valkyrie.list
sudo apt update && sudo apt install r5vlauncher

# Fedora/RHEL
sudo tee /etc/yum.repos.d/r5valkyrie.repo << EOF
[r5valkyrie]
name=R5Valkyrie Repository
baseurl=https://r5valkyrie.github.io/launcher/rpm/
enabled=1
gpgcheck=0
EOF
sudo dnf install r5vlauncher

# Arch Linux (AUR)
yay -S r5valkyrie-launcher-bin

# NixOS / Nix
nix run github:r5valkyrie/launcher
```

**Windows:** Download the [latest installer](https://github.com/r5valkyrie/launcher/releases/latest)

### For Developers

```bash
# Clone and setup
git clone https://github.com/r5valkyrie/launcher.git
cd launcher
npm install

# Start development
npm run dev
```

See the [Contributing Guide](CONTRIBUTING.md) for detailed development instructions.

---

## 📦 Release a New Version

```bash
npm run version:patch   # Bug fixes (0.9.40 -> 0.9.41)
npm run version:minor   # New features (0.9.40 -> 0.10.0)
npm run version:major   # Breaking changes (0.9.40 -> 1.0.0)
```

This automatically:
- Updates version in all files
- Creates a git tag
- Pushes to GitHub
- Triggers CI/CD to build all platform packages

---

## 📄 License

See [LICENSE](LICENSE) file for details.
