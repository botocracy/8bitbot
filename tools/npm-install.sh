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
# This file has been separated from npm-tasks.sh to aid in change-detection
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

# Absolute path to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

#
# Source includes
#

source "${SCRIPT_DIR}/npm-paths.sh"
source "${SCRIPT_DIR}/npm-utils.sh"

#
# Dispatch function
#
# This function contains the available tasks. The first argument identifies
# which task to jump to.
#
function dispatch() {
  case $1 in
  postinstall)
    postinstall
    ;;
  audit)
    audit
    ;;
  *)
    echo "Invalid task: $1"
    exit 1
    ;;
  esac
}

function postinstall() {
  # Patch jsonld.js
  patch_package "jsonld" "0001-Add-missing-webpack.config.js.patch"
  patch_package "jsonld" "0002-Switch-to-core-js-3.patch"
  patch_package "jsonld" "0003-Fix-exception-with-empty-process.version.patch"

  # Patch Threads library
  patch_package "threads" "0001-Fix-browser-error-bundling-with-Snowpack.patch"
}

function audit() {
  # Run audit which fails on discovery of moderate severity
  # Add --pass-enoaudit when using depedencies on their master branch
  audit-ci --moderate --package-manager npm
}

# Perform the dispatch
dispatch $1
