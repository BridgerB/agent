{
  description = "Node.js/SvelteKit E2E testing environment with Playwright";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = {nixpkgs, nixpkgs-unstable, ...} @ inputs: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
    pkgsUnstable = nixpkgs-unstable.legacyPackages.${system};
    nodejs = pkgs.nodejs_20;
    playwrightEnv = import ./playwright.nix {
      inherit pkgs nodejs;
      playwright = pkgsUnstable.playwright;
    };
  in {
    devShells.${system}.default = playwrightEnv.env;
  };
}