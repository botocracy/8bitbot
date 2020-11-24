################################################################################
#
#  Copyright (C) 2020 Marquise Stein
#  This file is part of 8bitbot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: Apache-2.0
#  See the file LICENSE.txt for more information.
#
################################################################################

################################################################################
#
# Keep3r Network
#
# An incentivized keeper network for anonymous keeper and job registration.
#
# SPDX-License-Identifier: MIT
#
################################################################################

# Dependency name and version
KEEP3R_REPO_NAME = keep3r.network
KEEP3R_VERSION = master
KEEP3R_REMOTE_REPO = https://github.com/keep3r-network/$(KEEP3R_REPO_NAME).git

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_KEEP3R = $(REPO_DIR)/$(KEEP3R_REPO_NAME)

# Build directory
BUILD_DIR_KEEP3R = $(BUILD_DIR)/$(KEEP3R_REPO_NAME)

################################################################################
#
# Configuration
#
################################################################################

KEEP3R_BUILD_DEPENDS = \
  $(S)/checkout-keep3r \

KEEP3R_TEST_DEPENDS = \
  $(S)/build-keep3r \

KEEP3R_INSTALL_DEPENDS = \
  $(S)/test-keep3r \

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-keep3r: $(S)/.precheckout
	[ -d "$(REPO_DIR_KEEP3R)" ] || ( \
	  git clone -b "$(KEEP3R_VERSION)" "$(KEEP3R_REMOTE_REPO)" "$(REPO_DIR_KEEP3R)" \
	)

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(S)/build-keep3r: $(S)/.prebuild $(KEEP3R_BUILD_DEPENDS)
	[ -d "$(BUILD_DIR_KEEP3R)" ] || ( \
	  git clone -b "$(KEEP3R_VERSION)" "$(REPO_DIR_KEEP3R)" "$(BUILD_DIR_KEEP3R)" \
	)

	@# TODO

	#cd "$(BUILD_DIR_KEEP3R)" && \
	#  python3.9 -m venv "$(BUILD_DIR_KEEP3R)" && \
	#  source bin/activate && \
	#  pip3 install eth-brownie

	#cd "$(BUILD_DIR_KEEP3R)" && \
	#  source bin/activate && \
	#  brownie compile

	touch "$@"

################################################################################
#
# Test
#
################################################################################

$(S)/test-keep3r: $(S)/.preinstall $(KEEP3R_TEST_DEPENDS)
	@# TODO

	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(S)/install-keep3r: $(S)/.preinstall $(KEEP3R_INSTALL_DEPENDS)
	mkdir -p "$(CONTRACTS_DIR)/keep3r/contracts"
	mkdir -p "$(CONTRACTS_DIR)/keep3r/interfaces"

	#@ TODO
	#cp -r "$(BUILD_DIR_KEEP3R)/contracts"/* "$(CONTRACTS_DIR)/keep3r/contracts"
	#cp -r "$(BUILD_DIR_KEEP3R)/interfaces"/* "$(CONTRACTS_DIR)/keep3r/interfaces"

	touch "$@"
