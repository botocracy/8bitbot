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
ZEROEX_REPO_NAME = protocol
ZEROEX_REMOTE_REPO = https://github.com/0xProject/$(ZEROEX_REPO_NAME).git

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_ZEROEX = $(REPO_DIR)/0x-$(ZEROEX_REPO_NAME)

################################################################################
#
# Import contract rules
#
################################################################################

include depends/0x/contracts-exchange/package.mk

################################################################################
#
# Configuration
#
################################################################################

ZEROEX_BUILD_DEPENDS = \
  $(S)/build-0x-exchange

ZEROEX_TEST_DEPENDS = \
  $(S)/test-0x-exchange

ZEROEX_INSTALL_DEPENDS = \
  $(S)/install-0x-exchange

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-0x: $(S)/.precheckout
	[ -d "$(REPO_DIR_ZEROEX)" ] || ( \
	  git clone "$(ZEROEX_REMOTE_REPO)" "$(REPO_DIR_ZEROEX)" \
	)

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(S)/build-0x: $(S)/.prebuild $(ZEROEX_BUILD_DEPENDS)
	@# Delegated to individual packages

	touch "$@"

################################################################################
#
# Test
#
################################################################################

$(S)/test-0x: $(S)/.preinstall $(ZEROEX_TEST_DEPENDS)
	@# Delegated to individual packages

	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(S)/install-0x: $(S)/.preinstall $(ZEROEX_INSTALL_DEPENDS)
	@# Delegated to individual packages

	touch "$@"
