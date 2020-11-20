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
# 0x Protocol
#
# SPDX-License-Identifier: Apache-2.0
#
################################################################################

# Dependency name and version
EXCHANGE_NAME = exchange
EXCHANGE_PKG_NAME = @0x/contracts-$(EXCHANGE_NAME)
EXCHANGE_VERSION = 3.2.15
EXCHANGE_TAG = $(EXCHANGE_PKG_NAME)@$(EXCHANGE_VERSION)

################################################################################
#
# Paths
#
################################################################################

# Build monorepo directory
BUILD_DIR_EXCHANGE = $(BUILD_DIR)/0x-$(EXCHANGE_NAME)

# Build package directory
#BUILD_DIR_EXCHANGE_PKG = $(BUILD_DIR_EXCHANGE)/contracts/$(EXCHANGE_NAME)

# Build output
#BUILD_FILE_EXCHANGE = $(BUILD_DIR_EXCHANGE)/lib/$(EXCHANGE_LIB)

# Install output
#INSTALL_FILE_EXCHANGE = $(DEPENDS_DIR)/lib/$(EXCHANGE_LIB)

################################################################################
#
# Build
#
################################################################################

$(S)/build-0x-exchange: $(S)/.prebuild $(S)/checkout-0x
	[ -d "$(BUILD_DIR_EXCHANGE)" ] || ( \
	  git clone -b "$(EXCHANGE_TAG)" "$(REPO_DIR_ZEROEX)" "$(BUILD_DIR_EXCHANGE)" && \
	  patch \
	    -p1 \
	    --forward \
	    --directory="$(BUILD_DIR_EXCHANGE)" \
	    --reject-file="/dev/null" \
	    --no-backup-if-mismatch \
	    <"$(TOOL_DIR)/depends/@0x/0001-Fix-Typescript-errors-in-0x-order-utils.patch" \
	    || : && \
	  patch \
	    -p1 \
	    --forward \
	    --directory="$(BUILD_DIR_EXCHANGE)" \
	    --reject-file="/dev/null" \
	    --no-backup-if-mismatch \
	    <"$(TOOL_DIR)/depends/@0x/0002-Fix-Typescript-errors-in-0x-contracts-utils.patch" \
	    || : && \
	  patch \
	    -p1 \
	    --forward \
	    --directory="$(BUILD_DIR_EXCHANGE)" \
	    --reject-file="/dev/null" \
	    --no-backup-if-mismatch \
	    <"$(TOOL_DIR)/depends/@0x/0003-Fix-Typescript-errors-in-0x-contracts-erc1155.patch" \
	    || : && \
	  patch \
	    -p1 \
	    --forward \
	    --directory="$(BUILD_DIR_EXCHANGE)" \
	    --reject-file="/dev/null" \
	    --no-backup-if-mismatch \
	    <"$(TOOL_DIR)/depends/@0x/0004-Fix-Typescript-errors-in-0x-contracts-erc20.patch" \
	    || : && \
	  patch \
	    -p1 \
	    --forward \
	    --directory="$(BUILD_DIR_EXCHANGE)" \
	    --reject-file="/dev/null" \
	    --no-backup-if-mismatch \
	    <"$(TOOL_DIR)/depends/@0x/0005-Fix-Typescript-errors-in-0x-contracts-asset-proxy.patch" \
	    || : && \
	  patch \
	    -p1 \
	    --forward \
	    --directory="$(BUILD_DIR_EXCHANGE)" \
	    --reject-file="/dev/null" \
	    --no-backup-if-mismatch \
	    <"$(TOOL_DIR)/depends/@0x/0006-Fix-Typescript-errors-in-0x-contracts-exchange.patch" \
	    || : && \
	  patch \
	    -p1 \
	    --forward \
	    --directory="$(BUILD_DIR_EXCHANGE)" \
	    --reject-file="/dev/null" \
	    --no-backup-if-mismatch \
	    <"$(TOOL_DIR)/depends/@0x/0007-Fix-swapped-tasks-in-package.json.patch" \
	    || : \
	)

	touch "$@"

################################################################################
#
# Test
#
################################################################################

$(S)/test-0x-exchange: $(S)/.prebuild $(S)/build-0x-exchange $(S)/checkout-nvm
	cd "$(BUILD_DIR_EXCHANGE)" && \
	  export NVM_DIR="$(REPO_DIR_NVM)" && \
	  source "$(REPO_DIR_NVM)/nvm.sh" && \
	  nvm install 12

	cd "$(BUILD_DIR_EXCHANGE)" && \
	  export NVM_DIR="$(REPO_DIR_NVM)" && \
	  source "$(REPO_DIR_NVM)/nvm.sh" && \
	  npm install -g yarn

	cd "$(BUILD_DIR_EXCHANGE)" && \
	  export NVM_DIR="$(REPO_DIR_NVM)" && \
	  `#export NODE_PATH="$(BUILD_DIR_EXCHANGE)/node_modules" &&` \
	  source "$(REPO_DIR_NVM)/nvm.sh" && \
	  yarn install

	cd "$(BUILD_DIR_EXCHANGE)" && \
	  export NVM_DIR="$(REPO_DIR_NVM)" && \
	  source "$(REPO_DIR_NVM)/nvm.sh" && \
	  PKG="$(EXCHANGE_PKG_NAME)" yarn build

	cd "$(BUILD_DIR_EXCHANGE)" && \
	  export NVM_DIR="$(REPO_DIR_NVM)" && \
	  source "$(REPO_DIR_NVM)/nvm.sh" && \
	  PKG="$(EXCHANGE_PKG_NAME)" yarn test

	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(S)/install-0x-exchange: $(S)/.preinstall $(S)/test-0x-exchange
	mkdir -p "$(DEPENDS_DIR)"

	: # TODO

	touch "$@"
