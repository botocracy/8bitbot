#!/bin/bash
################################################################################
#
#  Copyright (C) 2019-2020 Marquise Stein
#  This file is part of 8bitbot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: Apache-2.0
#  See the file LICENSES/README.md for more information.
#
################################################################################

#
# NPM scripting entry point
#
# Call via:
#
#   npm-scripts.sh <task>
#
# See the function dispatch() for the available tasks that can be run.
#

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

# Get the absolute path to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

#
# Dispatch function
#
# This function contains the available tasks. The first argument identifies
# which task to jump to.
#
function dispatch() {
  case $1 in
  start)
    start
    ;;
  preinstall)
    preinstall
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
  format)
    format
    ;;
  test)
    test
    ;;
  clean)
    clean
    ;;
  *)
    echo "Invalid task: $1"
    exit 1
    ;;
  esac
}

function start() {
  # Start snowpack dev server
  snowpack dev
}

function preinstall() {
  # Bridge to installation entry point
  "${SCRIPT_DIR}/npm-install.sh" preinstall
}

function postinstall() {
  # Bridge to installation entry point
  "${SCRIPT_DIR}/npm-install.sh" postinstall
}

function depends() {
  # Dependencies to build
  BUILD_DEPENDS="emscripten "

  # Build OpenCV
  if [ ! -f "tools/dist/lib/libopencv_core.a" ] || [ ! -f "src/generated/opencv.js" ]; then
    rm -f tools/stamps/build-opencv
    BUILD_DEPENDS+="opencv "
  fi

  # Build Solidity
  if [ ! -f "tools/bin/solc" ]; then
    rm -f tools/stamps/build-solidity
    BUILD_DEPENDS+="solidity "
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
  # Add --pass-enoaudit when using depedencies on their master branch
  audit-ci --moderate --package-manager npm --pass-enoaudit
}

function lint() {
  # Lint JavaScript package files
  prettier --check .

  # Lint Python language files
  if command -v black &>/dev/null; then
    black --check tools/depends
  fi
}

function format() {
  # Format JavaScript package files
  prettier --write .

  # Format Python language files
  if command -v black &>/dev/null; then
    black tools/depends
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

function clean() {
  node clean.js
}

# Perform the dispatch
dispatch $1
