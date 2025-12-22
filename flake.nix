{
  description = "R5Valkyrie Launcher - Electron-based game launcher";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        # Node.js and npm versions
        nodejs = pkgs.nodejs_20;
        
        # Build the application
        r5vlauncher = pkgs.stdenv.mkDerivation rec {
          pname = "r5vlauncher";
          version = "0.9.65";

          src = ./.;

          nativeBuildInputs = with pkgs; [
            nodejs
            nodePackages.npm
            makeWrapper
            copyDesktopItems
          ];

          buildInputs = with pkgs; [
            electron
          ];

          configurePhase = ''
            export HOME=$TMPDIR
            export npm_config_cache=$TMPDIR/npm-cache
            npm ci --loglevel verbose
          '';

          buildPhase = ''
            npm run build:web
            node scripts/bundleElectron.cjs
          '';

          installPhase = ''
            mkdir -p $out/lib/r5vlauncher
            mkdir -p $out/bin

            # Copy built application files
            cp -r dist $out/lib/r5vlauncher/
            cp -r electron $out/lib/r5vlauncher/
            cp -r node_modules $out/lib/r5vlauncher/
            cp package.json $out/lib/r5vlauncher/
            cp manifest.json $out/lib/r5vlauncher/

            # Create wrapper script
            makeWrapper ${pkgs.electron}/bin/electron $out/bin/r5vlauncher \
              --add-flags "$out/lib/r5vlauncher/electron/main.js" \
              --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc ]}"

            # Install icon if it exists
            if [ -f build/icon.png ]; then
              mkdir -p $out/share/icons/hicolor/512x512/apps
              cp build/icon.png $out/share/icons/hicolor/512x512/apps/r5vlauncher.png
            fi

            # Create desktop entry
            mkdir -p $out/share/applications
            cat > $out/share/applications/r5vlauncher.desktop <<EOF
            [Desktop Entry]
            Name=R5Valkyrie Launcher
            Exec=$out/bin/r5vlauncher
            Terminal=false
            Type=Application
            Icon=r5vlauncher
            Categories=Game;
            Comment=R5Valkyrie Game Launcher
            MimeType=x-scheme-handler/r5v;
            EOF
          '';

          meta = with pkgs.lib; {
            description = "R5Valkyrie Launcher - Electron-based game launcher";
            homepage = "https://github.com/r5valkyrie/launcher";
            license = licenses.unfree;
            maintainers = [ ];
            platforms = platforms.linux;
          };
        };

      in
      {
        packages = {
          default = r5vlauncher;
          r5vlauncher = r5vlauncher;
        };

        apps = {
          default = {
            type = "app";
            program = "${r5vlauncher}/bin/r5vlauncher";
          };
        };

        # Development shell with all necessary dependencies
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            nodePackages.npm
            electron
            git
            # Additional Linux dependencies for Electron
            xorg.libX11
            xorg.libXext
            xorg.libXrandr
            xorg.libXrender
            xorg.libXtst
            xorg.libXi
            xorg.libxcb
            xorg.libXcursor
            xorg.libXdamage
            xorg.libXfixes
            xorg.libXScrnSaver
            libGL
            mesa
            glib
            gtk3
            nss
            nspr
            alsa-lib
            cups
            libdrm
            libxkbcommon
            pango
            cairo
            expat
            dbus
            at-spi2-atk
            at-spi2-core
            libnotify
            libuuid
            wayland
          ];

          shellHook = ''
            echo "R5Valkyrie Launcher Development Environment"
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
            echo ""
            echo "Available commands:"
            echo "  npm run dev          - Start development server"
            echo "  npm run build        - Build application"
            echo "  npm run build:web    - Build web assets only"
            echo "  nix build            - Build with Nix"
            echo "  nix run              - Run the application"
            echo ""

            # Set up Electron to work properly
            export ELECTRON_DISABLE_SANDBOX=1
            export npm_config_cache=$PWD/.npm-cache
          '';

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath (with pkgs; [
            stdenv.cc.cc
            xorg.libX11
            xorg.libXext
            xorg.libXrandr
            xorg.libXrender
            xorg.libXtst
            xorg.libXi
            xorg.libxcb
            libGL
            mesa
            glib
            gtk3
            nss
            nspr
            alsa-lib
            cups
            libdrm
            libxkbcommon
            pango
            cairo
            expat
            dbus
            at-spi2-atk
            at-spi2-core
          ]);
        };
      });
}
