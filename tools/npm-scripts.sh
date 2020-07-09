#!/bin/bash

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

function start() {
  snowpack dev
}

function postinstall() {
  # Patch jsonld.js
  for patch in \
      "0001-Add-missing-webpack.config.js.patch" \
      "0002-Switch-to-core-js-3.patch" \
      "0003-Fix-exception-with-empty-process.version.patch" \
  ; do
    patch -p1 --forward --directory="node_modules/jsonld" < \
      "tools/depends/jsonld.js/${patch}" || [ "$?" == "1" ]
  done
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
  mocha \
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
