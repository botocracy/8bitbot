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
# Build system stages
#
# Depends on the following variables:
#
#   - CHECKOUT_DEPENDS: The checkout stage targets
#   - BUILD_DEPENDS: The build stage targets
#   - INSTALL_DEPENDS: The install stage targets
#
################################################################################

include setup_paths.mk

# Phony targets for build stages
.PHONY: checkout
.PHONY: build
.PHONY: install
.PHONY: all
.PHONE: clean
.PHONY: distclean

# Set the stage used when make is called with no arguments
all: install

################################################################################
#
# Build stage setup
#
# Dependency procedures must depend on these.
#
# Stages are cached based on the hash of "manifest.mk". Instead of the
# complexity of detecting build step changes, we require running "make clean"
# whenever something relevant changes.
#
################################################################################

#
# Setup checkout stage
#

$(S)/.precheckout: \
  manifest.mk
	mkdir -p "$(S)"
	mkdir -p "$(REPO_DIR)"

	touch "$@"

#
# Setup build stage
#

$(S)/.prebuild: \
  manifest.mk
	mkdir -p "$(S)"
	mkdir -p "$(BUILD_DIR)"

	touch "$@"

#
# Setup install stage
#

$(S)/.preinstall: \
  manifest.mk
	mkdir -p "$(S)"
	mkdir -p "$(INSTALL_DIR)"

	touch "$@"
