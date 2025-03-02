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

      apps = {
        start-container = {
          type = "app";
          program = toString (pkgs.writeScript "start-container" ''
            #!${pkgs.bash}/bin/bash
            set -euo pipefail
            
            echo "Starting container setup..."
            
            # Ensure clean slate
            sudo nixos-container stop agent 2>/dev/null || true
            sudo nixos-container destroy agent 2>/dev/null || true
            
            # Create container
            echo "Creating container..."
            sudo nixos-container create agent --flake .#container
            if [ $? -ne 0 ]; then
              echo "Failed to create container"
              exit 1
            fi
            
            # Start container with timeout and retry
            echo "Starting container..."
            for attempt in {1..3}; do
              if sudo timeout 60 nixos-container start agent; then
                echo "Container started successfully"
                sleep 2  # Give it time to stabilize
                container_status=$(sudo nixos-container status agent)
                echo "Container status: $container_status"
                
                # Check if status contains "up"
                if echo "$container_status" | grep -q "up"; then
                  echo "Container verified running"
                  # Additional debugging
                  echo "Listing running processes in container:"
                  sudo nixos-container run agent -- ps -ef || sudo nixos-container run agent -- ps || echo "Failed to list processes"
                  echo "Checking tmux session as agent user:"
                  sudo nixos-container run agent -- su - agent -c "tmux list-sessions" 2>/dev/null || echo "No tmux sessions found"
                  echo "Container IP: 10.233.1.2"
                  echo "You can connect with: sudo nixos-container run agent -- su - agent -c 'tmux attach -t agent-session'"
                  exit 0
                else
                  echo "Container started but not in expected state: $container_status"
                  sudo nixos-container stop agent
                fi
              else
                echo "Attempt $attempt failed, retrying in 5 seconds..."
                sleep 5
              fi
            done
            
            echo "Failed to start container after 3 attempts"
            echo "Checking logs..."
            sudo systemctl status container@agent.service || true
            sudo journalctl -xeu container@agent.service || true
            exit 1
          '');
        };

        stop-container = {
          type = "app";
          program = toString (pkgs.writeScript "stop-container" ''
            #!${pkgs.bash}/bin/bash
            set -euo pipefail
            
            echo "Stopping container..."
            
            # Graceful stop with timeout
            sudo timeout 30 nixos-container stop agent 2>/dev/null || true
            sudo nixos-container destroy agent 2>/dev/null || true
            
            # Verify cleanup
            if ! nixos-container list | grep -q agent; then
              echo "Container stopped and destroyed successfully"
            else
              echo "Warning: Container cleanup incomplete"
              exit 1
            fi
          '');
        };
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
              tmux
              procps  # For ps command
            ];

            users.users.agent = {
              isNormalUser = true;
              password = "agent";
              extraGroups = ["wheel"];
              shell = pkgs.bash;  # Explicitly set shell
            };

            security.sudo.wheelNeedsPassword = false;

            networking.useHostResolvConf = false;
            networking.nameservers = ["8.8.8.8" "8.8.4.4"];

            # Ensure the container keeps running
            systemd.services.keep-alive = {
              description = "Keep container running";
              wantedBy = ["multi-user.target"];
              serviceConfig = {
                ExecStart = "${pkgs.coreutils}/bin/tail -f /dev/null";
                Restart = "always";
              };
            };

            systemd.services.agent-tmux = {
              description = "Start tmux session for agent";
              wantedBy = ["multi-user.target"];
              after = ["network.target"];
              serviceConfig = {
                Type = "oneshot";
                RemainAfterExit = true;
                ExecStart = ''
                  ${pkgs.su}/bin/su - agent -c "${pkgs.tmux}/bin/tmux new-session -d -s agent-session -c /home/agent"
                '';
                ExecStop = ''
                  ${pkgs.su}/bin/su - agent -c "${pkgs.tmux}/bin/tmux kill-session -t agent-session"
                '';
                Restart = "on-failure";
                TimeoutStartSec = "30";
              };
            };
          })
        ];
      };
    };
}