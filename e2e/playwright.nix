{ pkgs, nodejs, playwright }:
pkgs.buildFHSEnv (pkgs.appimageTools.defaultFhsEnvArgs // {
  name = "playwright-env";
  targetPkgs = pkgs:
    with pkgs; [
      nodejs
      playwright
      libGL
      libxkbcommon
      xorg.libX11
      xorg.libXcomposite
      xorg.libXdamage
      xorg.libXfixes
      xorg.libXi
      xorg.libXrandr
      xorg.libXtst
      alsa-lib
      nss
      nspr
      cups
      fontconfig
      atk
      pango
      cairo
      gdk-pixbuf
      gtk3
      glib
      dbus
      libdrm
      mesa
      xorg.libXext
      xorg.libxcb
      gcc
      gnumake
      git
      tzdata
      glibcLocales
    ];
  multiPkgs = pkgs: with pkgs; [
    zlib
  ];
  profile = ''
    export NODE_PATH="${nodejs}/lib/node_modules"
    export npm_config_prefix="$PWD/.npm-global"
    export PATH="$PWD/.npm-global/bin:$PATH"
    export PLAYWRIGHT_BROWSERS_PATH="${playwright}/libexec/playwright"
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
    export LANG="C.UTF-8"
    export LC_ALL="C.UTF-8"
    export HISTCONTROL="ignoreboth:erasedups"
    if [ ! -d "$PWD/.npm-global" ]; then
      mkdir -p "$PWD/.npm-global"
      npm config set prefix "$PWD/.npm-global"
      echo "Created .npm-global directory"
    fi
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
      echo "Installing project dependencies..."
      npm install
    fi
    echo "Playwright E2E testing environment activated:"
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo "Playwright version: $(npx playwright --version)"
    echo "Browser path: $PLAYWRIGHT_BROWSERS_PATH"
    echo "Chromium path: $(ls -d $PLAYWRIGHT_BROWSERS_PATH/chromium-* 2>/dev/null || echo 'Not found')"
  '';
})