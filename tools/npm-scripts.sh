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
