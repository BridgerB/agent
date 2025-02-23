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
        ];
      };
    }) // {
      nixosConfigurations.container = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ({ pkgs, ... }: {
            system.stateVersion = "23.11";
            boot.isContainer = true;
            
            networking = {
              firewall = {
                enable = true;
                allowedTCPPorts = [ 8080 ];
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

      apps.x86_64-linux = {
        start-container = {
          type = "app";
          program = toString (nixpkgs.legacyPackages.x86_64-linux.writeScript "start-container" ''
            #!${nixpkgs.legacyPackages.x86_64-linux.bash}/bin/bash
            set -e
            sudo nixos-container destroy agent || true
            sudo nixos-container create agent --flake .#container
            sudo nixos-container start agent
            echo "VSCode server available at http://10.233.1.2:8080"
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
