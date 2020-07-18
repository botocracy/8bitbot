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
#   2. patch
#   3. build
#   4. install (default if no stage is given)
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

# Build system setup
include setup_stages.mk
include setup_paths.mk

# Build parameter setup
include setup_environment.mk

# Define the shell used to execute commands
SHELL := /bin/bash

################################################################################
#
# Build system paths
#
################################################################################

# Checkout directories
REPO_DIR_ANDROID_SDK = $(REPO_DIR)/android-sdk
REPO_DIR_CODECBOX_JS = $(REPO_DIR)/$(CODECBOX_JS_REPO_NAME)
REPO_DIR_EMSDK = $(REPO_DIR)/$(EMSDK_REPO_NAME)
REPO_DIR_GOOGLE_TEST = $(REPO_DIR)/$(GOOGLE_TEST_REPO_NAME)
REPO_DIR_OPENCV = $(REPO_DIR)/$(OPENCV_REPO_NAME)

# Build directories
BUILD_DIR_ANDROID_SDK = $(BUILD_DIR)/android-sdk
BUILD_DIR_CODECBOX_JS = $(BUILD_DIR)/$(CODECBOX_JS_REPO_NAME)
BUILD_DIR_EMSDK = $(BUILD_DIR)/$(EMSDK_REPO_NAME)
BUILD_DIR_GOOGLE_TEST = $(BUILD_DIR)/$(GOOGLE_TEST_REPO_NAME)
BUILD_DIR_OPENCV = $(BUILD_DIR)/$(OPENCV_REPO_NAME)

# Build files
BUILD_FILE_CODECBOX_JS = $(BUILD_DIR_CODECBOX_JS)/src/$(CODECBOX_JS_LIB)
BUILD_FILE_GOOGLE_TEST = $(BUILD_DIR_GOOGLE_TEST)/lib/$(GOOGLE_TEST_LIB)
BUILD_FILE_OPENCV = $(BUILD_DIR_OPENCV)/bin/$(OPENCV_LIB)

# Install files
INSTALL_FILE_GOOGLE_TEST = $(DEPENDS_INSTALL_DIR)/lib/$(GOOGLE_TEST_LIB)
INSTALL_FILE_OPENCV = $(INSTALL_DIR)/$(OPENCV_LIB)

################################################################################
#
# Dependency graph
#
################################################################################

#
# Configure Codecbox.js
#

CODECBOX_JS_BUILD_DEPENDS = \
  $(S)/checkout-codecbox.js \
  $(S)/patch-codecbox.js \
  $(S)/build-emsdk

#
# Configure Emscripten SDK
#

EMSDK_BUILD_DEPENDS = \
  $(S)/checkout-emsdk

#
# Configure Google Test
#

GOOGLE_TEST_BUILD_DEPENDS = \
  $(S)/checkout-google-test

#
# Configure OpenCV
#

OPENCV_BUILD_DEPENDS = \
  $(S)/checkout-opencv \
  $(S)/build-emsdk

ifeq ($(PLATFORM),darwin)
  OPENCV_BUILD_DEPENDS += $(S)/checkout-android-sdk
endif

################################################################################
#
# Import package rules
#
################################################################################

include depends/android-sdk/package.mk
include depends/codecbox.js/package.mk
include depends/emscripten/package.mk
include depends/googletest/package.mk
include depends/opencv/package.mk

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
  $(S)/checkout-codecbox.js \
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
  $(BUILD_FILE_CODECBOX_JS) \
  $(BUILD_FILE_OPENCV) \

#
# Define targets for "make install"
#

INSTALL_DEPENDS = \
  $(S)/install-codecbox.js \
  $(INSTALL_FILE_OPENCV) \

#
# Inject targets
#

checkout: $(CHECKOUT_DEPENDS)
build: $(BUILD_DEPENDS)
install: $(INSTALL_DEPENDS)

#
# Define targets for building individual depends via "make <depend>"
#

.PHONY: codecbox.js
.PHONY: emscripten
.PHONY: google-test
.PHONY: opencv

codecbox.js: \
  $(S)/install-codecbox.js

emscripten: \
  $(S)/build-emsdk

google-test: \
  $(INSTALL_FILE_GOOGLE_TEST)

opencv: \
  $(INSTALL_FILE_OPENCV)

################################################################################
#
# Build system procedures
#
################################################################################

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
