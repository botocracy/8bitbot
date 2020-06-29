################################################################################
#
#  Copyright (C) 2019-2020 Marquise Stein
#  This file is part of 8bitbot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: Apache-2.0
#  See the file LICENSE.txt for more information.
#
################################################################################

################################################################################
#
# Build chain for dependendies
#
# Make is used to run shell commands instead of bash to allow for parallel
# intermediary build stages.
#
# The primary build stages that can be specified on the command line are:
#
#   1. checkout
#   2. build
#   3. install (default if no stage is given)
#
# Two stages are used for cleaning temoprary files:
#
#   1. clean
#   2. distclean
#
# "make clean" is used to remove temporary build artifacts. "make distclean" is
# used to remove all temporary files and reset the directory to an unused state.
#
# This Makefile depends on the following packages:
#
#   - curl
#   - patch
#   - python3
#   - unzip
#
################################################################################

# Dependency definitions
include manifest.mk

# Build system setup
include setup_stages.mk
include setup_paths.mk

# Build parameter setup
include setup_environment.mk

################################################################################
#
# Build system paths
#
################################################################################

# Checkout directories
REPO_DIR_ANDROID_SDK = $(REPO_DIR)/android-sdk
REPO_DIR_EMSDK = $(REPO_DIR)/$(EMSDK_REPO_NAME)
REPO_DIR_OPENCV = $(REPO_DIR)/$(OPENCV_REPO_NAME)

# Build directories
BUILD_DIR_ANDROID_SDK = $(BUILD_DIR)/android-sdk
BUILD_DIR_EMSDK = $(BUILD_DIR)/$(EMSDK_REPO_NAME)
BUILD_DIR_OPENCV = $(BUILD_DIR)/$(OPENCV_REPO_NAME)

# Build files
BUILD_FILE_OPENCV = $(BUILD_DIR_OPENCV)/bin/$(OPENCV_LIB)

# Install files
INSTALL_FILE_OPENCV = $(INSTALL_DIR)/$(OPENCV_LIB)

################################################################################
#
# Dependency configuration
#
################################################################################

#
# Configure Emscripten SDK
#

EMSDK_BUILD_DEPENDS = \
  $(S)/checkout-emsdk

#
# Configure OpenCV
#

OPENCV_BUILD_FLAGS = \
  --config "$(TOOL_DIR)/depends/opencv/opencv_js.config.py" \
  --cmake_option="-DCMAKE_BUILD_PARALLEL_LEVEL=$(getconf _NPROCESSORS_ONLN)" \
  --emscripten_dir="$(REPO_DIR_EMSDK)/upstream/emscripten"

OPENCV_BUILD_DEPENDS = \
  $(S)/checkout-opencv \
  $(S)/build-emsdk

ifeq ($(PLATFORM),darwin)
  OPENCV_BUILD_DEPENDS += $(S)/checkout-android-sdk
  # TODO: On darwin, use the ninja build provided by the Android SDK
  # --cmake_option="-DCMAKE_MAKE_PROGRAM=ninja" etc.
  OPENCV_BUILD_FLAGS +=
endif

################################################################################
#
# Build system targets
#
# Defines the targets that are build when "make" is run.
#
################################################################################

#
# Define targets for "make checkout"
#

CHECKOUT_DEPENDS = \
  $(S)/checkout-emsdk \
  $(S)/checkout-opencv \
  $(S)/patch-opencv

ifeq ($(PLATFORM),darwin)
  CHECKOUT_DEPENDS += $(S)/checkout-android-sdk
endif

#
# Define targets for "make build"
#

BUILD_DEPENDS = \
  $(BUILD_FILE_OPENCV)

#
# Define targets for "make install"
#

INSTALL_DEPENDS = \
  $(INSTALL_FILE_OPENCV)

#
# Inject targets
#

checkout: $(CHECKOUT_DEPENDS)
build: $(BUILD_DEPENDS)
install: $(INSTALL_DEPENDS)

#
# Define targets for building individual depends via "make <depend>"
#

.PHONY: opencv

opencv: \
  $(INSTALL_FILE_OPENCV)

################################################################################
#
# Build system procedures
#
################################################################################

#
# Checkout Android SDK
#

$(S)/checkout-android-sdk: $(S)/.precheckout
	mkdir -p "$(REPO_DIR_ANDROID_SDK)"

	[ -f "$(REPO_DIR)/android-sdk-macos-4.0.zip" ] || \
	  curl --silent "https://dl.google.com/android/repository/commandlinetools-mac-6609375_latest.zip" \
	  > "$(REPO_DIR)/android-sdk-macos-4.0.zip"

	unzip -q -n "$(REPO_DIR)/android-sdk-macos-4.0.zip" \
	  -d "$(REPO_DIR_ANDROID_SDK)"

	cd "$(REPO_DIR_ANDROID_SDK)/tools/bin" && \
	  yes | ./sdkmanager --sdk_root="`pwd`/../.." --licenses && \
	  ./sdkmanager --sdk_root="`pwd`/../.." platform-tools && \
	  ./sdkmanager --sdk_root="`pwd`/../.." "platforms;android-28" && \
	  ./sdkmanager --sdk_root="`pwd`/../.." "build-tools;28.0.3"

	touch "$@"

#
# Check out Emscripten SDK
#

$(S)/checkout-emsdk: $(S)/.precheckout
	[ -d "$(REPO_DIR_EMSDK)" ] || git clone -b $(EMSDK_VERSION) "$(EMSDK_REMOTE_REPO)" "$(REPO_DIR_EMSDK)"

	@# TODO: Repository sync is delegated to the CI system.

	# Download and install the latest SDK tools.
	cd "$(REPO_DIR_EMSDK)" && \
	  "$(REPO_DIR_EMSDK)/emsdk" install --build=Release --shallow $(EMSDK_SDK_TOOLS_VERSION)

	touch "$@"

#
# Check out OpenCV
#

$(S)/checkout-opencv: $(S)/.precheckout
	[ -d "$(REPO_DIR_OPENCV)" ] ||  git clone -b $(OPENCV_VERSION) "$(OPENCV_REMOTE_REPO)" "$(REPO_DIR_OPENCV)"

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

#
# Patch OpenCV
#

$(S)/patch-opencv: $(S)/checkout-opencv \
  $(TOOL_DIR)/depends/opencv/opencv_js.config.py
	cp "$(TOOL_DIR)/depends/opencv/opencv_js.config.py" "$(REPO_DIR_OPENCV)/platforms/js"

	touch "$@"

#
# Build Emscripten
#

$(S)/build-emsdk: $(S)/.prebuild $(EMSDK_BUILD_DEPENDS)
	# Make SDK "active" for the current user (writes .emscripten file)
	cd "$(REPO_DIR_EMSDK)" && \
	  "$(REPO_DIR_EMSDK)/emsdk" activate $(EMSDK_SDK_TOOLS_VERSION)

	# Create an evironment setup script
	cd "$(REPO_DIR_EMSDK)" && \
	  "$(REPO_DIR_EMSDK)/emsdk" construct_env

	touch "$@"

#
# Build OpenCV
#

$(BUILD_FILE_OPENCV): $(S)/.prebuild $(OPENCV_BUILD_DEPENDS)
	mkdir -p "$(BUILD_DIR_OPENCV)"

	# Activate PATH and other environment variables in the current terminal and
	# build OpenCV
	. "$(REPO_DIR_EMSDK)/emsdk_set_env.sh" && \
	  CMAKE_BUILD_PARALLEL_LEVEL=$(getconf _NPROCESSORS_ONLN) \
	    python3 "$(REPO_DIR_OPENCV)/platforms/js/build_js.py" $(OPENCV_BUILD_FLAGS) \
	      "$(BUILD_DIR_OPENCV)"

	touch "$@"

#
# Install OpenCV
#

$(INSTALL_FILE_OPENCV): $(S)/.preinstall \
  $(BUILD_FILE_OPENCV) \
  $(TOOL_DIR)/depends/opencv/0001-temp-Hack-opencv.js-to-ES6.patch
	mkdir -p "$(INSTALL_DIR)"

	# Copy generated files
	cp "$(BUILD_FILE_OPENCV)" "$(INSTALL_DIR)"

	# Hack in ES6 support
	patch --no-backup-if-mismatch -d "$(INSTALL_DIR)" < "$(TOOL_DIR)/depends/opencv/0001-temp-Hack-opencv.js-to-ES6.patch"

#
# Clean stage
#

clean:
	rm -rf "$(BUILD_DIR)"
	rm -rf "$(S)"

#
# Distclean stage
#

distclean: clean
	rm -rf "$(REPO_DIR)"
