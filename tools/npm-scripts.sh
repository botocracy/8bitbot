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

# Absolute path to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

#
# Source includes
#

source "${SCRIPT_DIR}/npm-paths.sh"

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
  postinstall)
    postinstall
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

function postinstall() {
  # Bridge to installation entry point
  "${SCRIPT_DIR}/npm-install.sh" postinstall
}

function build() {
  # Build snowpack package
  snowpack build
}

function audit() {
  # Run audit which fails on discovery of moderate severity
  # Add --pass-enoaudit when using depedencies on their master branch
  audit-ci --moderate --package-manager npm
}

function lint() {
  # Lint JavaScript package files
  prettier --check .
}

function format() {
  # Format JavaScript package files
  prettier --write .
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
