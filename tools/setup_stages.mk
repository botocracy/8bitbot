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
.PHONY: test
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
################################################################################

#
# Setup checkout stage
#

$(S)/.precheckout:
	mkdir -p "$(S)"
	mkdir -p "$(REPO_DIR)"

	touch "$@"

#
# Setup patch stage
#

$(S)/.prepatch:
	mkdir -p "$(S)"

	touch "$@"

#
# Setup build stage
#

$(S)/.prebuild:
	mkdir -p "$(S)"
	mkdir -p "$(BUILD_DIR)"

	touch "$@"

#
# Setup test stage
#

$(S)/.pretest:
	mkdir -p "$(S)"

	touch "$@"

#
# Setup install stage
#

$(S)/.preinstall:
	mkdir -p "$(S)"
	mkdir -p "$(INSTALL_DIR)"

	touch "$@"
