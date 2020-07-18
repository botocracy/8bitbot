################################################################################
#
#  Copyright (C) 2020 Marquise Stein
#  This file is part of 8bitbot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: Apache-2.0
#  See the file LICENSE.txt for more information.
#
################################################################################

# Dependency name and version
GOOGLE_TEST_REPO_NAME = googletest
GOOGLE_TEST_VERSION = 1.10.0
GOOGLE_TEST_REMOTE_REPO = https://github.com/google/$(GOOGLE_TEST_REPO_NAME).git
GOOGLE_TEST_LIB = libgtest.a

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-google-test: $(S)/.precheckout
	[ -d "$(REPO_DIR_GOOGLE_TEST)" ] || \
	  git clone -b release-$(GOOGLE_TEST_VERSION) "$(GOOGLE_TEST_REMOTE_REPO)" "$(REPO_DIR_GOOGLE_TEST)"

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(BUILD_FILE_GOOGLE_TEST): $(S)/.prebuild $(GOOGLE_TEST_BUILD_DEPENDS)
	mkdir -p "${BUILD_DIR_GOOGLE_TEST}"

	cd "$(BUILD_DIR_GOOGLE_TEST)" && \
	  cmake "$(REPO_DIR_GOOGLE_TEST)" \
	    -DCMAKE_INSTALL_PREFIX="$(DEPENDS_INSTALL_DIR)" \
	    -DCMAKE_BUILD_PARALLEL_LEVEL=$(shell getconf _NPROCESSORS_ONLN)

	cmake --build "$(BUILD_DIR_GOOGLE_TEST)"

	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(INSTALL_FILE_GOOGLE_TEST): $(S)/.preinstall $(BUILD_FILE_GOOGLE_TEST)
	mkdir -p "$(DEPENDS_INSTALL_DIR)"

	cmake --build "$(BUILD_DIR_GOOGLE_TEST)" --target install

	touch "$@"
