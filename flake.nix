{
  description = "Swing Sonic";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    bun-overlay = {
      url = "github:alleneubank/bun-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {nixpkgs, bun-overlay, ...}: let
    eachSystem = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed;
  in {
    devShells = eachSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
          overlays = [bun-overlay.overlays.default];
        };
      in {
        default = pkgs.mkShell {
          packages = [pkgs.bun];
        };
      }
    );
  };
}
