# R5Valkyrie Launcher - Package Repository

Official package repository for R5Valkyrie Launcher.

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

## Manual Downloads

- [DEB Packages](./deb/)
- [RPM Packages](./rpm/)

---
Last updated: $(date)
