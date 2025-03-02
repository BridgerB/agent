{
  description = "LLM agent with mouse control capabilities";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs_23
        ];
      };
    }) // {
      nixosConfigurations.container = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ({ pkgs, ... }: {
            system.stateVersion = "24.11";
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
              extraGroups = ["wheel"];
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
            sudo nixos-container destroy agent || true
            sudo nixos-container create agent --flake .#container
            sudo nixos-container start agent
          '');
        };

        stop-container = {
          type = "app";
          program = toString (nixpkgs.legacyPackages.x86_64-linux.writeScript "stop-container" ''
            #!${nixpkgs.legacyPackages.x86_64-linux.bash}/bin/bash
            sudo nixos-container stop agent
            sudo nixos-container destroy agent
          '');
        };
      };
    };
}