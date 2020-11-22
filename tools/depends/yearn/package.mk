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
# Yearn protocol
#
# Requires python >= 3.8
#
#   sudo add-apt-repository ppa:deadsnakes/ppa
#   sudo apt update
#   sudo apt install python3.9-dev python3.9-venv
#
# Requires ganache:
#
#   npm install -g ganache-cli
#
# Requires the following environment variables:
#
#   - ETHERSCAN_TOKEN
#   - WEB3_INFURA_PROJECT_ID
#
# SPDX-License-Identifier: AGPL-3.0-or-later
#
################################################################################

# Dependency name and version
YEARN_REPO_NAME = yearn-protocol
YEARN_VERSION = develop
#YEARN_VERSION = v0.1.0-audit.0
YEARN_REMOTE_REPO = https://github.com/iearn-finance/$(YEARN_REPO_NAME).git

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_YEARN = $(REPO_DIR)/$(YEARN_REPO_NAME)

# Build directory
BUILD_DIR_YEARN = $(BUILD_DIR)/$(YEARN_REPO_NAME)

################################################################################
#
# Configuration
#
################################################################################

YEARN_BUILD_DEPENDS = \
  $(S)/checkout-yearn \

YEARN_TEST_DEPENDS = \
  $(S)/build-yearn \

YEARN_INSTALL_DEPENDS = \
  $(S)/test-yearn \

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-yearn: $(S)/.precheckout
	[ -d "$(REPO_DIR_YEARN)" ] || ( \
	  git clone -b "$(YEARN_VERSION)" "$(YEARN_REMOTE_REPO)" "$(REPO_DIR_YEARN)" \
	)

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(S)/build-yearn: $(S)/.prebuild $(YEARN_BUILD_DEPENDS)
	[ -d "$(BUILD_DIR_YEARN)" ] || ( \
	  git clone -b "$(YEARN_VERSION)" "$(REPO_DIR_YEARN)" "$(BUILD_DIR_YEARN)" && \
	  patch \
	    -p1 \
	    --forward \
	    --directory="$(BUILD_DIR_YEARN)" \
	    --reject-file="/dev/null" \
	    --no-backup-if-mismatch \
	    < "$(TOOL_DIR)/depends/yearn/0001-Delegate-OpenZeppelin-versioning-to-dependency-manag.patch" \
	    || : \
	)

	touch "$@"

################################################################################
#
# Test
#
################################################################################

$(S)/test-yearn: $(S)/.preinstall $(YEARN_TEST_DEPENDS)
	@# Verify that ETHERSCAN_TOKEN and WEB3_INFURA_PROJECT_ID are set
	if [ -z "$${ETHERSCAN_TOKEN}" ] || [ -z "$${WEB3_INFURA_PROJECT_ID}" ]; then \
	  echo "To test yearn, set ETHERSCAN_TOKEN and WEB3_INFURA_PROJECT_ID variables" && \
	  exit 1; \
	fi

	cd "$(BUILD_DIR_YEARN)" && \
	  python3.9 -m venv "$(BUILD_DIR_YEARN)" && \
	  source bin/activate && \
	  pip3 install eth-brownie

	cd "$(BUILD_DIR_YEARN)" && \
	  source bin/activate && \
	  brownie compile

	cd "$(BUILD_DIR_YEARN)" && \
	  source bin/activate && \
	  brownie test -s

	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(S)/install-yearn: $(S)/.preinstall $(YEARN_INSTALL_DEPENDS)
	mkdir -p "$(CONTRACTS_DIR)/yearn/contracts"
	mkdir -p "$(CONTRACTS_DIR)/yearn/interfaces"

	cp -r "$(BUILD_DIR_YEARN)/contracts"/* "$(CONTRACTS_DIR)/yearn/contracts"
	cp -r "$(BUILD_DIR_YEARN)/interfaces"/* "$(CONTRACTS_DIR)/yearn/interfaces"

	touch "$@"
