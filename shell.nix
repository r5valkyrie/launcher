{ pkgs ? import <nixpkgs> {} }:

let
  lib = import <nixpkgs/lib>;
  buildNodeJs = pkgs.callPackage "${<nixpkgs>}/pkgs/development/web/nodejs/nodejs.nix" {
    python = pkgs.python3;
  };

  #nodejs = buildNodeJs {
  #  enableNpm = false;
  #  version = "22.20.0";
  #  sha256 = "/3pqbooTEq9YdeQAWDUcT4kNKKtkwy8SsswZmvoiAC0=";
  #};

  NPM_CONFIG_PREFIX = toString ./npm_config_prefix;

in pkgs.mkShell {
  packages = with pkgs; [
    nodejs
    nodePackages.npm
    python3
    clang
    umu-launcher
  ];

  inherit NPM_CONFIG_PREFIX;

  shellHook = ''
    export PATH="${NPM_CONFIG_PREFIX}/bin:$PATH"
  '';
}
