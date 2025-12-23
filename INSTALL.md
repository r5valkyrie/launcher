# Installation Guide

Choose your platform below for installation instructions.

> 💡 **Quick Navigation:** [Windows](#windows) | [Linux](#linux) | [Package Verification](#package-verification)

---

## Requirements

Before installing, ensure you have:

- **Steam**: Required for running the game
- **Windows**: Windows 10 or later
- **Linux**: Any modern distribution with:
  - Wine/Proton for running Windows executables
  - UMU launcher (automatically included in all packages)

---

## Windows

### Install with Installer (Recommended)

1. Download the latest installer from [Releases](https://github.com/r5valkyrie/launcher/releases/latest)
   - Look for: `R5Valkyrie Launcher Setup [version].exe`

2. Run the downloaded `.exe` file

3. Follow the installation wizard
   - Choose installation directory (optional)
   - Select whether to create desktop shortcut

4. Launch the launcher from your desktop or Start menu

The installer automatically:
- ✅ Creates desktop and Start menu shortcuts
- ✅ Registers the `r5v://` protocol handler
- ✅ Sets up auto-update functionality

---

## Linux

### Debian/Ubuntu

#### Using Repository (Recommended)

Add the repository for automatic updates:

```bash
# Add the R5Valkyrie repository
echo 'deb [trusted=yes] https://r5valkyrie.github.io/launcher/deb/ ./' | sudo tee /etc/apt/sources.list.d/r5valkyrie.list

# Update package list and install
sudo apt update
sudo apt install r5vlauncher
```

**Benefits:**
- ✅ Automatic updates with `apt upgrade`
- ✅ Easy removal with `apt remove`
- ✅ Dependency management

#### Manual Installation

```bash
# Download the package
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version]-Debian.deb

# Install the package
sudo dpkg -i R5Valkyrie.Launcher-[version]-Debian.deb

# Fix any missing dependencies
sudo apt-get install -f
```

---

### Fedora/RHEL/openSUSE

#### Using Repository (Recommended)

Add the repository for automatic updates:

```bash
# Add the R5Valkyrie repository
sudo tee /etc/yum.repos.d/r5valkyrie.repo << EOF
[r5valkyrie]
name=R5Valkyrie Repository
baseurl=https://r5valkyrie.github.io/launcher/rpm/
enabled=1
gpgcheck=0
EOF

# Install
sudo dnf install r5vlauncher      # For Fedora/RHEL
# or
sudo zypper install r5vlauncher   # For openSUSE
```

**Benefits:**
- ✅ Automatic updates with system updates
- ✅ Easy removal with package manager
- ✅ Dependency management

#### Manual Installation

```bash
# Download the package
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version].rpm

# Install with your package manager
sudo dnf install ./R5Valkyrie.Launcher-[version].rpm      # Fedora/RHEL
# or
sudo zypper install ./R5Valkyrie.Launcher-[version].rpm   # openSUSE
```

---

### Arch Linux

#### Using AUR (Recommended)

The easiest method is using an AUR helper:

```bash
# Using yay
yay -S r5valkyrie-launcher-bin

# Or using paru
paru -S r5valkyrie-launcher-bin
```

**Benefits:**
- ✅ Automatic updates with AUR helper
- ✅ Manages dependencies automatically
- ✅ Integration with pacman

#### Manual Package Installation

```bash
# Download the package
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version]-Arch.pkg.tar.zst

# Install with pacman
sudo pacman -U R5Valkyrie.Launcher-[version]-Arch.pkg.tar.zst
```

**Note:** The package depends on `umu-launcher` which is available in the AUR. Install it first if not using an AUR helper:
```bash
yay -S umu-launcher
```

---

### NixOS / Nix

#### Quick Run (No Installation)

Perfect for trying out the launcher:

```bash
nix run github:r5valkyrie/launcher
```

#### Install to User Profile

For persistent installation:

```bash
nix profile install github:r5valkyrie/launcher
```

#### System-Wide Installation

Add to your NixOS configuration (`configuration.nix` or flake):

```nix
{
  inputs.r5vlauncher.url = "github:r5valkyrie/launcher";
  
  # Add to your configuration
  environment.systemPackages = [
    inputs.r5vlauncher.packages.${pkgs.system}.default
  ];
}
```

Then rebuild your system:
```bash
sudo nixos-rebuild switch
```

---

### AppImage (Universal)

Works on any Linux distribution without installation:

```bash
# Download the AppImage
wget https://github.com/r5valkyrie/launcher/releases/latest/download/R5Valkyrie.Launcher-[version].AppImage

# Make it executable
chmod +x R5Valkyrie.Launcher-[version].AppImage

# Run it
./R5Valkyrie.Launcher-[version].AppImage
```

**Benefits:**
- ✅ Works on any Linux distribution
- ✅ No installation required
- ✅ Portable - can run from USB drive
- ✅ All dependencies bundled

**Optional:** Integrate with your desktop environment using [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)

---

## Package Verification

All releases include SHA256 checksums to verify download integrity:

```bash
# Download the checksums file
wget https://github.com/r5valkyrie/launcher/releases/latest/download/SHA256SUMS

# Verify your downloaded package
sha256sum -c SHA256SUMS --ignore-missing
```

You should see output like:
```
R5Valkyrie.Launcher-X.X.X.AppImage: OK
```

---

## Uninstallation

### Windows
- Use "Add or Remove Programs" in Windows Settings
- Or run the uninstaller from the installation directory

### Debian/Ubuntu
```bash
sudo apt remove r5vlauncher
```

### Fedora/RHEL/openSUSE
```bash
sudo dnf remove r5vlauncher      # Fedora/RHEL
sudo zypper remove r5vlauncher   # openSUSE
```

### Arch Linux
```bash
sudo pacman -R r5valkyrie-launcher-bin
```

### NixOS / Nix
```bash
nix profile remove r5vlauncher
```

### AppImage
Simply delete the `.AppImage` file

---

## Troubleshooting

**Issue:** Package won't install on Debian/Ubuntu  
**Solution:** Run `sudo apt-get install -f` to fix dependency issues

**Issue:** Permission denied when running AppImage  
**Solution:** Make sure you ran `chmod +x` on the file

**Issue:** Launcher won't start on Linux  
**Solution:** Ensure you have Steam installed and Wine/Proton configured

**Need more help?** 
- Check the [main README](README.md)
- Open an [issue](https://github.com/r5valkyrie/launcher/issues)
- Visit the [discussions](https://github.com/r5valkyrie/launcher/discussions)

---

**[← Back to README](README.md)**
