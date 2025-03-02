{
  description = "NixOS Container with VSCode Server and SvelteKit+Playwright Dev Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    # Dev Shell for SvelteKit and Playwright
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        nodejs_20  # Match your SvelteKit requirement
        (playwright.override { withBrowsers = true; })  # Playwright with browsers
        # Build essentials
        gcc
        gnumake
        # Version control
        git
        # Timezones
        tzdata
        # Locales
        glibcLocales
        # Playwright browser dependencies
        glib
        gtk3
        nss
        nspr
        dbus  # Added for libdbus-1.so.3
        libdrm
        xorg.libX11
        xorg.libXcomposite
        xorg.libXdamage
        xorg.libXext
        xorg.libXfixes
        xorg.libXrandr
        xorg.libxcb
        mesa
        alsa-lib
      ];
      shellHook = ''
        # Set NODE_PATH to include global node modules
        export NODE_PATH="${pkgs.nodejs_20}/lib/node_modules"

        # Set LANG for locales
        export LANG="C.UTF-8"

        # Remove duplicate commands from Bash shell command history
        export HISTCONTROL=ignoreboth:erasedups

        # Keep npm global installations local to the project
        export npm_config_prefix="$PWD/.npm-global"
        export PATH="$PWD/.npm-global/bin:$PATH"

        # Set Playwright browsers path
        export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright.browsers}"

        # Initialize npm if this is the first time
        if [ ! -d "$PWD/.npm-global" ]; then
          mkdir -p "$PWD/.npm-global"
          npm config set prefix "$PWD/.npm-global"
          npm install -g npm@latest  # Ensure latest npm
        fi

        # Install project dependencies if not present
        if [ ! -d "node_modules" ]; then
          echo "Installing project dependencies..."
          npm install
        fi

        # Show environment info
        echo "SvelteKit + Playwright environment activated:"
        echo "Node.js version: $(node --version)"
        echo "npm version: $(npm --version)"
        echo "Playwright version: $(npx playwright --version)"
      '';
    };

    # NixOS container configuration (unchanged)
    nixosConfigurations.container = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ({pkgs, ...}: {
          system.stateVersion = "24.11";
          boot.isContainer = true;

          networking = {
            firewall = {
              enable = true;
              allowedTCPPorts = [8080];
            };
            hostName = "agent";
          };

          environment.systemPackages = with pkgs; [
            nodejs_23
            xdotool
            toybox
            tree
          ];

          services.openvscode-server = {
            enable = true;
            user = "agent";
            group = "users";
            host = "0.0.0.0";
            port = 8080;
            withoutConnectionToken = true;
            extraPackages = with pkgs; [
              git
              nodejs
              yarn
            ];
          };

          users.users.agent = {
            isNormalUser = true;
            password = "agent";
            extraGroups = ["wheel"];
          };

          security.sudo.wheelNeedsPassword = false;
        })
      ];
    };

    # App definitions
    apps.${system} = {
      start-container = {
        type = "app";
        program = toString (pkgs.writeScript "start-container" ''
          #!${pkgs.bash}/bin/bash
          set -e
          sudo nixos-container destroy agent || true
          sudo nixos-container create agent --flake .#container --no-update-lock-file
          sudo nixos-container start agent
          echo "VSCode server available at http://10.233.1.2:8080"
        '');
      };

      stop-container = {
        type = "app";
        program = toString (pkgs.writeScript "stop-container" ''
          #!${pkgs.bash}/bin/bash
          sudo nixos-container stop agent
          sudo nixos-container destroy agent
        '');
      };

      start-sveltekit = {
        type = "app";
        program = toString (pkgs.writeScript "start-sveltekit" ''
          #!${pkgs.bash}/bin/bash
          npm run dev -- --host 0.0.0.0 --port 3000
        '');
      };

      run-playwright = {
        type = "app";
        program = toString (pkgs.writeScript "run-playwright" ''
          #!${pkgs.bash}/bin/bash
          npx playwright test
        '');
      };
    };
  };
}