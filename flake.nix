{
  description = "Neomovies";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          system = system;
          config = {
            allowUnfree = true;
          };
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_24
            corepack
            git
            watchman
	    pnpm
          ];

          shellHook = ''
	    export COREPACK_HOME="$PWD/.corepack"
	    export PATH="$COREPACK_HOME/shims:$PATH"
	    corepack enable --install-directory "$COREPACK_HOME/shims"
          '';
        };
      });
}
