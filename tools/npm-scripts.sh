#!/bin/bash

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

function start() {
  snowpack dev
}

#
# Helper function
#
# Usage:
#
#   patch_package <package name> <patch name>
#
function patch_package() {
  package=$1
  patch=$2

  patch -p1 --forward --directory="node_modules/${package}" < \
    "tools/depends/${package}/${patch}" || [[ "$?" == "1" ]]
}

function postinstall() {
  # Patch bittorrent-tracker
  #patch_package bittorrent-tracker 0001-temp-Add-debug-logging.patch

  # Patch jsonld.js
  patch_package "jsonld" "0001-Add-missing-webpack.config.js.patch"
  patch_package "jsonld" "0002-Switch-to-core-js-3.patch"
  patch_package "jsonld" "0003-Fix-exception-with-empty-process.version.patch"

  # Patch readable-stream library
  #patch_package "readable-stream" "0001-Fix-error-with-Webpack.patch"

  # Patch rollup-plugin-node-polyfills
  patch_package rollup-plugin-node-polyfills 0001-Compatibility-with-new-readable-stream.patch
  patch_package rollup-plugin-node-polyfills 0001-Don-t-fix-readable-stream-at-version-1.0.x.patch

  # Patch Threads library
  patch_package "threads" "0001-Fix-browser-error-bundling-with-Snowpack.patch"
}

function depends() {
  # Dependencies to build
  BUILD_DEPENDS="emscripten "

  # Build OpenCV
  if [ ! -f "src/generated/opencv.js" ]; then
    rm -f tools/stamps/build-opencv
    BUILD_DEPENDS+="opencv "
  fi

  # Bulid Codecbox.js
  if [ ! -d "tools/dist" ]; then
    rm -f tools/stamps/build-codecbox.js
    BUILD_DEPENDS+="codecbox.js "
  fi

  make -C tools -j$(getconf _NPROCESSORS_ONLN) ${BUILD_DEPENDS}

  # Build C++ libraries
  lib/build-ci.sh
}

function depends-checkout() {
  make -C tools checkout -j10
}

function depends-build() {
  make -C tools build -j$(getconf _NPROCESSORS_ONLN)
}

function depends-install() {
  make -C tools install
}

function build() {
  # Build snowpack package
  snowpack build
}

function audit() {
  # Run audit which fails on discovery of moderate severity
  audit-ci --moderate --package-manager npm
}

function lint() {
  # Lint JavaScript package files
  prettier --check .

  # Lint Python language files
  if command -v black &>/dev/null; then
    black --check tools/depends
  fi
}

function test() {
  lint

  # Run test suite
  ts-mocha \
    --require canvas \
    --require esm \
    --require isomorphic-fetch \
    --require jsdom-global/register
}

function format() {
  # Format JavaScript package files
  prettier --write .

  # Format Python language files
  if command -v black &>/dev/null; then
    black --check tools/depends
  fi
}

function clean() {
  node clean.js
}

# Dispatch script
case $1 in
  start)
    start
    ;;
  postinstall)
    postinstall
    ;;
  depends)
    depends
    ;;
  depends-checkout)
    depends-checkout
    ;;
  depends-build)
    depends-build
    ;;
  depends-install)
    depends-install
    ;;
  build)
    build
    ;;
  audit)
    audit
    ;;
  lint)
    lint
    ;;
  test)
    test
    ;;
  format)
    format
    ;;
  clean)
    clean
    ;;
  *)
    exit 1
    ;;
esac
