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

  # Patch Threads library
  for patch in \
      "0001-Fix-browser-error-bundling-with-Snowpack.patch" \
  ; do
    patch -p1 --forward --directory="node_modules/threads" < \
      "tools/depends/threads/${patch}" || [ "$?" == "1" ]
  done
}

function depends() {
  make -C tools -j$(getconf _NPROCESSORS_ONLN)
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
  # Build depends
  (
    [ -f "public/scene_detector/scene_detector.js" ] &&
    [ -f "public/scene_detector/scene_detector.wasm" ] &&
    [ -f "src/generated/opencv.js" ]
  ) || depends

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
