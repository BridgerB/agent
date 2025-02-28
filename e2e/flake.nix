# nix develop
# npx playwright test
{
  description = "Node.js/SvelteKit development environment based on the Filesystem Hierarchy Standard (FHS)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = {nixpkgs, ...} @ inputs: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};

    # Node.js version
    nodejs = pkgs.nodejs_20;
  in {
    devShells.${system}.default =
      (pkgs.buildFHSEnv (pkgs.appimageTools.defaultFhsEnvArgs
        // {
          name = "node-development-environment";
          targetPkgs = pkgs:
            with pkgs; [
              # Node.js and npm
              nodejs
              # Build essentials
              gcc
              gnumake
              # Version control
              git
              # Timezones
              tzdata
              # Locales
              glibcLocales
            ];
          profile = ''
            # Set NODE_PATH to include global node modules
            export NODE_PATH="${nodejs}/lib/node_modules";

            # Set LANG for locales
            export LANG="C.UTF-8"

            # Remove duplicate commands from Bash shell command history
            export HISTCONTROL=ignoreboth:erasedups

            # Keep npm global installations local to the project
            export npm_config_prefix="$PWD/.npm-global"
            export PATH="$PWD/.npm-global/bin:$PATH"

            # Initialize npm if this is the first time
            if [ ! -d "$PWD/.npm-global" ]; then
              mkdir -p "$PWD/.npm-global"
              npm config set prefix "$PWD/.npm-global"
            fi

            # Show environment info
            echo "Node.js development environment activated:"
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
          '';
        }))
      .env;
  };
}
