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
CODECBOX_JS_REPO_NAME = codecbox.js
CODECBOX_JS_VERSION = c31de35d32cc9e3f01dd577b3c27df7f24e599ed
CODECBOX_JS_REMOTE_REPO = https://github.com/duanyao/$(CODECBOX_JS_REPO_NAME).git
CODECBOX_JS_LIB = codecbox.js

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_CODECBOX_JS = $(REPO_DIR)/$(CODECBOX_JS_REPO_NAME)

# Build directory
BUILD_DIR_CODECBOX_JS = $(BUILD_DIR)/$(CODECBOX_JS_REPO_NAME)

# Build output
BUILD_FILE_CODECBOX_JS = $(BUILD_DIR_CODECBOX_JS)/src/$(CODECBOX_JS_LIB)

################################################################################
#
# Configuration
#
################################################################################

CODECBOX_JS_BUILD_DEPENDS = \
  $(S)/checkout-codecbox.js \
  $(S)/patch-codecbox.js \
  $(S)/build-emsdk

################################################################################
#
# Checkout
#
# Dependency: Run npm install first
#
################################################################################

$(S)/checkout-codecbox.js: $(S)/.precheckout
	# Clone repo
	[ -d "$(REPO_DIR_CODECBOX_JS)" ] || ( \
	  git clone "$(CODECBOX_JS_REMOTE_REPO)" "$(REPO_DIR_CODECBOX_JS)" && \
	  git -C "$(REPO_DIR_CODECBOX_JS)" reset --hard $(CODECBOX_JS_VERSION) \
	)

	# Clone depends
	cd "$(REPO_DIR_CODECBOX_JS)" && \
	PATH="$(TOOL_DIR)/../node_modules/.bin:${PATH}" \
	  grunt init --force

	touch "$@"

################################################################################
#
# Patch
#
################################################################################

$(S)/patch-codecbox.js: $(S)/.prepatch $(S)/checkout-codecbox.js \
  $(TOOL_DIR)/depends/codecbox.js/0001-Fix-error-building-OpenH264.patch \
  $(TOOL_DIR)/depends/codecbox.js/0002-Fix-errors-building-with-latest-llvm.patch \
  $(TOOL_DIR)/depends/codecbox.js/0003-Enable-select-filter.patch \
  $(TOOL_DIR)/depends/openh264/0001-Fix-build-on-macOS.patch \
  $(TOOL_DIR)/depends/x264/0001-Remove-problematic-configure-test.patch
	# Patch repo
	patch --forward --directory "$(REPO_DIR_CODECBOX_JS)" < \
	  "$(TOOL_DIR)/depends/codecbox.js/0001-Fix-error-building-OpenH264.patch" || ( \
	    code=$$?; [[ "$${code}" -lt "2" ]] || exit $${code}; \
	  )
	patch --forward --directory "$(REPO_DIR_CODECBOX_JS)" < \
	  "$(TOOL_DIR)/depends/codecbox.js/0002-Fix-errors-building-with-latest-llvm.patch" || ( \
	    code=$$?; [[ "$${code}" -lt "2" ]] || exit $${code}; \
	  )
	patch --forward --directory "$(REPO_DIR_CODECBOX_JS)" < \
	  "$(TOOL_DIR)/depends/codecbox.js/0003-Enable-select-filter.patch" || ( \
	    code=$$?; [[ "$${code}" -lt "2" ]] || exit $${code}; \
	  )

	# Patch depends
	patch -p1 --forward --directory "$(REPO_DIR_CODECBOX_JS)/build/openh264" < \
	  "$(TOOL_DIR)/depends/openh264/0001-Fix-build-on-macOS.patch" || ( \
	    code=$$?; [[ "$${code}" -lt "2" ]] || exit $${code}; \
	  )
	patch --forward --directory "$(REPO_DIR_CODECBOX_JS)/build/x264" < \
	  "$(TOOL_DIR)/depends/x264/0001-Remove-problematic-configure-test.patch" || ( \
	    code=$$?; [[ "$${code}" -lt "2" ]] || exit $${code}; \
	  )
	# TODO: Is zlib patch necessary?

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(BUILD_FILE_CODECBOX_JS): $(S)/.prebuild $(CODECBOX_JS_BUILD_DEPENDS)
	# Deep-copy repo to build folder for now
	[ -d "$(BUILD_DIR_CODECBOX_JS)" ] || ( \
	  cp -r "$(REPO_DIR_CODECBOX_JS)" "$(BUILD_DIR_CODECBOX_JS)" \
	)

	# Source Emscripten environment, then build Codecbox.js and dependencies
	cd "$(BUILD_DIR_CODECBOX_JS)" && \
	  . "$(REPO_DIR_EMSDK)/emsdk_set_env.sh" && \
	  PATH="$(TOOL_DIR)/../node_modules/.bin:$${PATH}" \
	    grunt build

	touch "$@"

$(S)/build-codecbox.js: $(BUILD_FILE_CODECBOX_JS)
	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(S)/install-codecbox.js: $(S)/.precheckout $(S)/build-codecbox.js
	install -d "$(TOOL_DIR)/dist"

	# Copy dist folder
	cp -r "${BUILD_DIR_CODECBOX_JS}/build/dist"/* "$(TOOL_DIR)/dist"

	touch "$@"
