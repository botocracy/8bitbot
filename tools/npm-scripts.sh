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
  # Patch jsonld.js
  patch_package "jsonld" "0001-Add-missing-webpack.config.js.patch"
  patch_package "jsonld" "0002-Switch-to-core-js-3.patch"
  patch_package "jsonld" "0003-Fix-exception-with-empty-process.version.patch"

  # Patch Threads library
  patch_package "threads" "0001-Fix-browser-error-bundling-with-Snowpack.patch"
}

function depends() {
  # Dependencies to build
  BUILD_DEPENDS="emscripten "

  # Build OpenCV
  if [ ! -f "tools/dist/lib/libopencv_core.a" ] || [ ! -f "src/generated/opencv.js" ]; then
    rm -f tools/stamps/build-opencv
    BUILD_DEPENDS+="opencv "
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
  # TODO: Add --require canvas if ImageData or other APIs are needed for tests
  ts-mocha \
    --recursive \
    --extension js \
    --extension ts \
    --require esm \
    --require isomorphic-fetch \
    --require jsdom-global/register
}

function format() {
  # Format JavaScript package files
  prettier --write .

  # Format Python language files
  if command -v black &>/dev/null; then
    black tools/depends
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
