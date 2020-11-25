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
# crosstool-NG
#
# A versatile (cross-)toolchain generator.
#
# Ubuntu dependencies:
#
#   sudo apt install flex help2man libncurses5-dev libtool-bin texinfo
#
# macOS dependencies:
#
#   brew install bash binutils coreutils gawk gettext gnu-sed help2man ncurses
#
# SPDX-License-Identifier: GPL-2.0-or-later
#
################################################################################

# Dependency name and version
CROSSTOOL_NG_REPO_NAME = crosstool-ng
CROSSTOOL_NG_VERSION = crosstool-ng-1.24.0
CROSSTOOL_NG_REMOTE_REPO = https://github.com/crosstool-ng/$(CROSSTOOL_NG_REPO_NAME).git
#CROSSTOOL_NG_BINARY = crosstool-ng

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_CROSSTOOL_NG = $(REPO_DIR)/$(CROSSTOOL_NG_REPO_NAME)

# Build directory
BUILD_DIR_CROSSTOOL_NG = $(BUILD_DIR)/$(CROSSTOOL_NG_REPO_NAME)

# Install directory
INSTALL_DIR_CROSSTOOL_NG = $(BINARY_DIR)

################################################################################
#
# Configuration
#
################################################################################

CROSSTOOL_NG_BUILD_DEPENDS = \
  $(S)/checkout-crosstool-ng \

CROSSTOOL_NG_INSTALL_DEPENDS = \
  $(S)/build-crosstool-ng \

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-crosstool-ng: $(S)/.precheckout
	[ -d "$(REPO_DIR_CROSSTOOL_NG)" ] || ( \
	  git clone -b $(CROSSTOOL_NG_VERSION) "$(CROSSTOOL_NG_REMOTE_REPO)" "$(REPO_DIR_CROSSTOOL_NG)" \
	)

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(S)/build-crosstool-ng: $(S)/.prebuild $(CROSSTOOL_NG_BUILD_DEPENDS)
	[ -d "$(BUILD_DIR_CROSSTOOL_NG)" ] || ( \
	  git clone -b "$(CROSSTOOL_NG_VERSION)" "$(REPO_DIR_CROSSTOOL_NG)" "$(BUILD_DIR_CROSSTOOL_NG)" \
	)

	cd "$(BUILD_DIR_CROSSTOOL_NG)" && \
	  ./bootstrap

ifneq ($(PLATFORM),darwin)
	cd "$(BUILD_DIR_CROSSTOOL_NG)" && \
	  ./configure --enable-local
else
	cd "$(BUILD_DIR_CROSSTOOL_NG)" && \
	  PATH="/usr/local/opt/binutils/bin:$${PATH}" \
	  LDFLAGS="-L/usr/local/opt/ncurses/lib -L/usr/local/opt/gettext/lib" \
	  CPPFLAGS="-I/usr/local/opt/ncurses/include -I/usr/local/opt/gettext/include" \
	  PKG_CONFIG_PATH="/usr/local/opt/ncurses/lib/pkgconfig" \
	  ./configure --enable-local
endif

	cd "$(BUILD_DIR_CROSSTOOL_NG)" && \
	  make

	cd "$(BUILD_DIR_CROSSTOOL_NG)" && \
	  ./ct-ng riscv64-unknown-linux-gnu

	cd "$(BUILD_DIR_CROSSTOOL_NG)" && \
	  V=0 ./ct-ng build

	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(S)/install-crosstool-ng: $(S)/.prebuild $(CROSSTOOL_NG_INSTALL_DEPENDS)
	mkdir -p "$(INSTALL_DIR_CROSSTOOL_NG)"

	cp -r "$(BUILD_DIR_CROSSTOOL_NG)/.build/riscv64-unknown-linux-gnu/buildtools/bin"/* "$(INSTALL_DIR_CROSSTOOL_NG)"

	touch "$@"
