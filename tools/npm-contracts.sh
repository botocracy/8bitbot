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
#   npm-contracts.sh <task> <network>
#
# See the function dispatch() for the available tasks that can be run.
#

# Parameters
NETWORK=$2

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
  compile)
    contracts-compile
    ;;
  local-node)
    contracts-local-node
    ;;
  deploy)
    contracts-deploy
    ;;
  verify)
    contracts-verify
    ;;
  run)
    contracts-run
    ;;
  export)
    contracts-export
    ;;
  *)
    echo "Invalid task: $1"
    exit 1
    ;;
  esac
}

function contracts-compile() {
  # Build smart contracts
  echo "Compiling contracts with Hardhat..."
  hardhat compile
  echo "Finished compiling contracts"
}

function contracts-local-node() {
  hardhat node --network hardhat
}

function contracts-deploy() {
  hardhat --network ${NETWORK} deploy
}

function contracts-verify() {
  hardhat --network ${NETWORK} etherscan-verify --solc-input
}

function contracts-run() {
  HARDHAT_NETWORK=${NETWORK} esm-ts-node scripts/run.ts
}

function contracts-export() {
  hardhat --network ${NETWORK} export
}

# Perform the dispatch
dispatch $1
