# R5Valkyrie Launcher - Package Repository

Official package repository for R5Valkyrie Launcher.

## NixOS / Nix

Run directly:
```bash
nix run github:r5valkyrie/launcher
```

Install to profile:
```bash
nix profile install github:r5valkyrie/launcher
```

Or add to your NixOS configuration:
```nix
{
  inputs.r5vlauncher.url = "github:r5valkyrie/launcher";
  
  # Then add to environment.systemPackages:
  environment.systemPackages = [
    inputs.r5vlauncher.packages.\${pkgs.system}.default
  ];
}
```

## Debian/Ubuntu

Add the repository:
```bash
echo 'deb [trusted=yes] https://r5valkyrie.github.io/launcher/deb/ ./' | sudo tee /etc/apt/sources.list.d/r5valkyrie.list
sudo apt update
```

Install:
```bash
sudo apt install r5vlauncher
```

## Fedora/RHEL/openSUSE

Add the repository:
```bash
sudo tee /etc/yum.repos.d/r5valkyrie.repo << EOF
[r5valkyrie]
name=R5Valkyrie Repository
baseurl=https://r5valkyrie.github.io/launcher/rpm/
enabled=1
gpgcheck=0
EOF
```

Install:
```bash
sudo dnf install r5vlauncher  # Fedora/RHEL
# or
sudo zypper install r5vlauncher  # openSUSE
```

## Arch Linux

### AUR (Recommended)
```bash
yay -S r5valkyrie-launcher-bin
# or
paru -S r5valkyrie-launcher-bin
```

### Manual Package Installation
Download the .pkg.tar.zst package from the [latest release](https://github.com/r5valkyrie/launcher/releases/latest) and install:
```bash
sudo pacman -U R5Valkyrie.Launcher-*.pkg.tar.zst
```

## All Package Downloads

[View all available packages on the latest release page](https://github.com/r5valkyrie/launcher/releases/latest)

---
Last updated: Tue Dec 23 16:09:21 UTC 2025
