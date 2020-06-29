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
OPENCV_REPO_NAME = opencv
OPENCV_VERSION = 4.5.0
OPENCV_REMOTE_REPO = https://github.com/opencv/$(OPENCV_REPO_NAME).git
OPENCV_LIB = opencv.js

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_OPENCV = $(REPO_DIR)/$(OPENCV_REPO_NAME)

# Build directory
BUILD_DIR_OPENCV = $(BUILD_DIR)/$(OPENCV_REPO_NAME)

# Build output
BUILD_FILE_OPENCV = $(BUILD_DIR_OPENCV)/bin/$(OPENCV_LIB)

# Install output
INSTALL_FILE_OPENCV = $(INSTALL_DIR)/$(OPENCV_LIB)

################################################################################
#
# Configuration
#
################################################################################

OPENCV_BUILD_DEPENDS = \
  $(S)/checkout-opencv \
  $(S)/build-emsdk

ifeq ($(PLATFORM),darwin)
  #OPENCV_BUILD_DEPENDS += $(S)/checkout-android-sdk
endif

OPENCV_BUILD_FLAGS = \
  --config "$(TOOL_DIR)/depends/opencv/opencv_js.config.py" \
  --cmake_option="\
    $(shell ! command -v ccache &> /dev/null || echo "-DCMAKE_CXX_COMPILER_LAUNCHER=ccache") \
  " \
  --emscripten_dir="$(REPO_DIR_EMSDK)/upstream/emscripten"

ifeq ($(PLATFORM),darwin)
  # TODO: On darwin, use the ninja build provided by the Android SDK
  # --cmake_option="-DCMAKE_MAKE_PROGRAM=ninja" etc.
  OPENCV_BUILD_FLAGS +=
endif

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-opencv: $(S)/.precheckout
	[ -d "$(REPO_DIR_OPENCV)" ] ||  git clone -b $(OPENCV_VERSION) "$(OPENCV_REMOTE_REPO)" "$(REPO_DIR_OPENCV)"

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Patch
#
################################################################################

$(S)/patch-opencv: $(S)/.prepatch $(S)/checkout-opencv \
  $(TOOL_DIR)/depends/opencv/opencv_js.config.py
	cp "$(TOOL_DIR)/depends/opencv/opencv_js.config.py" "$(REPO_DIR_OPENCV)/platforms/js"

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(BUILD_FILE_OPENCV): $(S)/.prebuild $(OPENCV_BUILD_DEPENDS)
	mkdir -p "$(BUILD_DIR_OPENCV)"

	# Activate PATH and other environment variables in the current terminal and
	# build OpenCV
	. "$(REPO_DIR_EMSDK)/emsdk_set_env.sh" && \
	  CMAKE_BUILD_PARALLEL_LEVEL=$(shell getconf _NPROCESSORS_ONLN) \
	    python3 "$(REPO_DIR_OPENCV)/platforms/js/build_js.py" $(OPENCV_BUILD_FLAGS) \
	      "$(BUILD_DIR_OPENCV)"

	touch "$@"

$(S)/build-opencv: $(BUILD_FILE_OPENCV)
	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(INSTALL_FILE_OPENCV): $(S)/.preinstall $(S)/build-opencv \
  $(TOOL_DIR)/depends/opencv/0001-temp-Hack-opencv.js-to-ES6.patch
	mkdir -p "$(INSTALL_DIR)"

	# Copy generated files
	cp "$(BUILD_FILE_OPENCV)" "$(INSTALL_DIR)"

	# Hack in ES6 support
	patch --no-backup-if-mismatch -d "$(INSTALL_DIR)" < "$(TOOL_DIR)/depends/opencv/0001-temp-Hack-opencv.js-to-ES6.patch"

$(S)/install-opencv: $(INSTALL_FILE_OPENCV)
	touch "$@"
