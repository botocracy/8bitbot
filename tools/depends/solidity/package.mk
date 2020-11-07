################################################################################
#
#  Copyright (C) 2020 Marquise Stein
#  This file is part of 8bitbot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: Apache-2.0
#  See the file LICENSE.txt for more information.
#
################################################################################

#
# This Makefile will result in a pre-release build leading to e.g. a flag being
# set in each bytecode produced by such a compiler. If you want to re-build a
# released Solidity compiler, then please use the source tarball on the github
# release page:
#
#   https://github.com/ethereum/solidity/releases/download/v0.X.Y/solidity_0.X.Y.tar.gz
#
# (not the source code provided by github).
#
# Solidity requires the following dependencies:
#
#   - CMake
#   - Boost
#   - Git
#   - z3 (optional, for use with SMT checker)
#
# On Ubuntu, these can be installed with:
#
#   sudo apt install build-essential cmake git libboost-all-dev
#
# On macOS, ensure that you have the latest version of Xcode installed. If
# installing Xcode for the first time, you will need to agree to the license
# before you can build:
#
#   sudo xcodebuild -license accept
#
# Dependencies on macOS can be installed with:
#
#   brew install cmake git boost
#
# For other platforms and CI infrastrure, see the "infrastucture-as-code"
# script at:
#
#   <solidity repo>/scripts/install_deps.sh
#

# Dependency name and version
SOLIDITY_REPO_NAME = solidity
SOLIDITY_VERSION = 0.6.12
SOLIDITY_REMOTE_REPO = https://github.com/ethereum/$(SOLIDITY_REPO_NAME).git
SOLIDITY_BIN = solc

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_SOLIDITY = $(REPO_DIR)/$(SOLIDITY_REPO_NAME)

# Build directory
BUILD_DIR_SOLIDITY = $(BUILD_DIR)/$(SOLIDITY_REPO_NAME)

# Build output
BUILD_FILE_SOLIDITY = $(BUILD_DIR_SOLIDITY)/solc/$(SOLIDITY_BIN)

# Install output
INSTALL_FILE_SOLIDITY = $(BINARY_DIR)/$(SOLIDITY_BIN)

################################################################################
#
# Configuration
#
################################################################################

SOLIDITY_BUILD_DEPENDS = \
  $(S)/checkout-solidity \

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-solidity: $(S)/.precheckout
	[ -d "$(REPO_DIR_SOLIDITY)" ] || ( \
	  git clone -b v$(SOLIDITY_VERSION) "$(SOLIDITY_REMOTE_REPO)" "$(REPO_DIR_SOLIDITY)" \
	)

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(BUILD_FILE_SOLIDITY): $(S)/.prebuild $(SOLIDITY_BUILD_DEPENDS)
	mkdir -p "$(BUILD_DIR_SOLIDITY)"

	cd "${BUILD_DIR_SOLIDITY}" && \
	cmake "$(REPO_DIR_SOLIDITY)" \
	  -DCMAKE_INSTALL_PREFIX="$(BINARY_DIR)/.." \
	  -DCMAKE_BUILD_PARALLEL_LEVEL=$(shell getconf _NPROCESSORS_ONLN) \
	  $(shell ! command -v ccache &> /dev/null || echo "-DCMAKE_CXX_COMPILER_LAUNCHER=ccache") \
	  -DTESTS=OFF \

	cmake --build "${BUILD_DIR_SOLIDITY}"

	touch "$@"

$(S)/build-solidity: $(BUILD_FILE_SOLIDITY)
	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(INSTALL_FILE_SOLIDITY): $(S)/.preinstall $(S)/build-solidity
	mkdir -p "$(BINARY_DIR)"

	cmake \
	  --build "${BUILD_DIR_SOLIDITY}" \
	  --target install

	touch "$@"

$(S)/install-solidity: $(INSTALL_FILE_SOLIDITY)
	touch "$@"
