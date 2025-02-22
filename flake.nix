{
  description = "LLM agent with mouse control capabilities";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs_23
          pnpm
          git
        ];
      };
    }) // {
      nixosConfigurations.container = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ({ pkgs, ... }: {
            system.stateVersion = "23.11";
            boot.isContainer = true;

            environment.systemPackages = with pkgs; [
              nodejs_23
              xdotool
              toybox
              tree
            ];

            users.users.agent = {
              isNormalUser = true;
              password = "agent";
              extraGroups = [ "wheel" ];
            };

            security.sudo.wheelNeedsPassword = false;
          })
        ];
      };

      apps.x86_64-linux = {
        start-container = {
          type = "app";
          program = toString (nixpkgs.legacyPackages.x86_64-linux.writeScript "start-container" ''
            #!${nixpkgs.legacyPackages.x86_64-linux.bash}/bin/bash
            set -e

            # Check if container already exists
            if sudo nixos-container status agent &>/dev/null; then
              echo "Container 'agent' already exists, starting it..."
              sudo nixos-container start agent
            else
              echo "Creating and starting container 'agent'..."
              sudo nixos-container create agent --flake .#container
              sudo nixos-container start agent
            fi

            echo "Container is running."
          '');
        };

        stop-container = {
          type = "app";
          program = toString (nixpkgs.legacyPackages.x86_64-linux.writeScript "stop-container" ''
            #!${nixpkgs.legacyPackages.x86_64-linux.bash}/bin/bash
            set -e
            echo "Stopping container..."
            sudo nixos-container stop agent || echo "Container already stopped"
            sudo nixos-container destroy agent
            echo "Container stopped and destroyed."
          '');
        };
      };
    };
}