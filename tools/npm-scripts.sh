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

  package_path="node_modules/${package}"
  patch_path="tools/depends/${package}/${patch}"

  # Can't discern between missing patch and already-applied patch
  if [ ! -f "${patch_path}" ]; then
    echo "Missing ${patch}!"
    exit 1
  fi

  echo "Patching: ${package_path}"

  patch -p1 --forward --directory="${package_path}" < "${patch_path}" || ( \
    code=$?; [[ "${code}" -lt "2" ]] || exit ${code}; \
  )
}

#
# Helper function
#
# Usage:
#
#   patch_package_recursive <package name> <patch name>
#
# To prevent conflicts of nested dependencies, the nested package versions can
# be controlled using the "resolutions" field in package.json.
#
function patch_package_recursive() {
  package=$1
  patch=$2

  patch_path="tools/depends/${package}/${patch}"

  # Can't discern between missing patch and already-applied patch
  if [ ! -f "${patch_path}" ]; then
    echo "Missing ${patch}!"
    exit 1
  fi

  for package_path in $(find "node_modules" -name "${package}"); do
    # Skip rollup polyfills
    if echo "${package_path}" | grep --quiet rollup-plugin-node-polyfills; then
      continue
    fi

    # Skip type declarations
    if echo "${package_path}" | grep --quiet "@types/${package}"; then
      continue
    fi

    echo "Patching: ${package_path}"

    patch -p1 --forward --directory="${package_path}" < "${patch_path}" || ( \
      code=$?; [[ "${code}" -lt "2" ]] || exit ${code}; \
    )
  done
}

function preinstall() {
  # Create/update package-lock.json for npx
  npm install --package-lock-only --ignore-scripts

  # Force recursive dependencies based on "resolutions" field in package.json
  npx npm-force-resolutions
}

function postinstall() {
  # Patch bittorrent library
  patch_package "bittorrent-tracker" "0001-Fix-runtime-error-due-to-wrapped-import.patch"

  # Patch ethereum-waffle libraries
  patch_package "@ethereum-waffle/chai" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "@ethereum-waffle/compiler" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "@ethereum-waffle/ens" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "@ethereum-waffle/mock-contract" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "@ethereum-waffle/provider" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "ethereum-waffle" "0001-package.json-Fix-module-entry-point.patch"

  # Patch jsonld.js
  patch_package "jsonld" "0001-Add-missing-webpack.config.js.patch"
  patch_package "jsonld" "0002-Switch-to-core-js-3.patch"
  patch_package "jsonld" "0003-Fix-exception-with-empty-process.version.patch"

  # Patch p2p-media-loader libraries
  patch_package "p2p-media-loader-core" "0001-Fix-build-error-due-to-commonjs-translation-bug.patch"
  patch_package "p2p-media-loader-core" "0002-Fix-runtime-error-with-snowpack.patch"
  patch_package "p2p-media-loader-hlsjs" "0001-Fix-build-error-due-to-commonjs-translation-bug.patch"

  # Patch readable-stream library (recursively)
  patch_package_recursive "readable-stream" "0001-Fix-circular-dependency.patch"

  # Patch Threads library
  patch_package "threads" "0001-Fix-browser-error-bundling-with-Snowpack.patch"

  # Patch Videostream library
  patch_package "videostream" "0001-Fix-runtime-error-due-to-wrapped-import.patch"
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
  # Build smart contracts
  echo "Compiling contracts with waffle..."
  waffle
  echo "Finished compiling contracts"

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

function test() {
  lint

  # Build smart contracts if not already built
  if [ ! -d "build-contracts" ]; then
    echo "Compiling contracts with waffle..."
    waffle
    echo "Finished compiling contracts"
  fi

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
