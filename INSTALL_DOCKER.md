# 🐳 Install Docker Desktop - Step by Step Guide

## Download Docker Desktop

### Option 1: Direct Download (Recommended)
1. **Go to**: https://www.docker.com/products/docker-desktop/
2. **Click**: "Download for Windows"
3. **Save** the installer file (Docker Desktop Installer.exe)

### Option 2: Alternative Download
1. **Go to**: https://docs.docker.com/desktop/install/windows-install/
2. **Click**: "Download Docker Desktop for Windows"
3. **Save** the installer file

## Install Docker Desktop

1. **Run** the downloaded `Docker Desktop Installer.exe`
2. **Follow** the installation wizard:
   - ✅ Check "Use WSL 2 instead of Hyper-V" (recommended)
   - ✅ Check "Add shortcut to desktop"
3. **Click** "Install"
4. **Wait** for installation to complete
5. **Click** "Close and restart" when prompted

## After Installation

1. **Restart** your computer if prompted
2. **Launch** Docker Desktop from Start Menu
3. **Wait** for Docker Desktop to start (whale icon in system tray)
4. **Accept** the license agreement
5. **Complete** the setup wizard

## Verify Installation

Open PowerShell and run:
```powershell
docker --version
docker compose version
```

You should see version numbers like:
```
Docker version 24.0.7, build afdd53b
Docker Compose version v2.21.0
```

## Troubleshooting

### If Docker doesn't start:
1. **Enable WSL 2**:
   - Open PowerShell as Administrator
   - Run: `wsl --install`
   - Restart computer

2. **Enable Virtualization**:
   - Restart computer
   - Enter BIOS/UEFI settings
   - Enable Intel VT-x or AMD-V
   - Save and exit

3. **Check Windows Features**:
   - Open "Turn Windows features on or off"
   - Enable "Hyper-V" or "Windows Subsystem for Linux"

## Next Steps

Once Docker is installed and running:
1. **Run** the website launcher: `.\start_website.ps1`
2. **Or** manually start: `docker compose -f docker-compose.dev.yml up --build`
3. **Open** your browser to: http://localhost:3000

---

**🎯 Goal**: Get Docker Desktop running so we can launch your website!

