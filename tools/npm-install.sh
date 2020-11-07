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
# NPM script entry point for installation-related tasks
#
# This file has been separated from npm-scripts.sh to aid in change-detection
# for CI infrastructure.
#
# Call via:
#
#   npm-install.sh <task>
#
# See the function dispatch() for the available tasks that can be run.
#

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

# Get the absolute path to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Import utility functions
source "${SCRIPT_DIR}/npm-utils.sh"

#
# Dispatch function
#
# This function contains the available tasks. The first argument identifies
# which task to jump to.
#
function dispatch() {
  case $1 in
  preinstall)
    preinstall
    ;;
  postinstall)
    postinstall
    ;;
  *)
    echo "Invalid task: $1"
    exit 1
    ;;
  esac
}

function preinstall() {
  # Create/update package-lock.json for npx
  npm install --package-lock-only --ignore-scripts

  # Force recursive dependencies based on "resolutions" field in package.json
  npx npm-force-resolutions
}

function postinstall() {
  # Patch 0x libraries
  rm -rf "node_modules/@0x/typescript-typings/types/chai"             # Duplicate symbols
  rm -rf "node_modules/@0x/typescript-typings/types/chai-as-promised" # Duplicate symbols
  rm -rf "node_modules/@0x/typescript-typings/types/ganache-core"     # Outdated symbols
  patch -p1 --forward --directory="node_modules/0x.js/node_modules/@0x/subproviders" < \
    "tools/depends/0x.js/0001-Fix-build-error-due-to-ganache-version-mismatch.patch" || (
    code=$?
    [[ "${code}" -lt "2" ]] || exit ${code}
  )

  # Patch bittorrent library
  patch_package "bittorrent-tracker" "0001-Fix-runtime-error-due-to-wrapped-import.patch"

  # Patch duplexer3 library
  patch_package_recursive "duplexer3" "0001-Replace-stream-package-with-readable-stream.patch"

  # Patch ethereum-waffle libraries
  patch_package "@ethereum-waffle/chai" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "@ethereum-waffle/compiler" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "@ethereum-waffle/ens" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "@ethereum-waffle/mock-contract" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "@ethereum-waffle/provider" "0001-package.json-Fix-module-entry-point.patch"
  patch_package "ethereum-waffle" "0001-package.json-Fix-module-entry-point.patch"

  # Patch hdkey library
  patch_package_recursive "hdkey" "0001-Replace-crypto-builtins-with-npm-packages.patch"

  # Patch jsonld.js
  patch_package "jsonld" "0001-Add-missing-webpack.config.js.patch"
  patch_package "jsonld" "0002-Switch-to-core-js-3.patch"
  patch_package "jsonld" "0003-Fix-exception-with-empty-process.version.patch"

  # Patch merkle-patricia-tree library
  rm_dist "merkle-patricia-tree"

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

  # Patch web3-provider-engine library
  rm_dist "web3-provider-engine"
}

# Perform the dispatch
dispatch $1
