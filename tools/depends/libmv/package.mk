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
LIBMV_REPO_NAME = libmv
LIBMV_VERSION = master # TODO
LIBMV_REMOTE_REPO = https://github.com/libmv/$(LIBMV_REPO_NAME).git
LIBMV_LIB = libmv.a # TODO

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_LIBMV = $(REPO_DIR)/$(LIBMV_REPO_NAME)

# Build directory
BUILD_DIR_LIBMV = $(BUILD_DIR)/$(LIBMV_REPO_NAME)

# Build output
BUILD_FILE_LIBMV = $(BUILD_DIR_LIBMV)/lib/$(LIBMV_LIB)

# Install output
INSTALL_FILE_LIBMV = $(DEPENDS_DIR)/lib/$(LIBMV_LIB)

################################################################################
#
# Configuration
#
################################################################################

LIBMV_BUILD_DEPENDS = \
  $(S)/checkout-libmv \
  $(S)/build-emsdk \

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-libmv: $(S)/.precheckout
	[ -d "$(REPO_DIR_LIBMV)" ] ||  ( \
	  git clone -b $(LIBMV_VERSION) "$(LIBMV_REMOTE_REPO)" "$(REPO_DIR_LIBMV)" \
	)

	patch -p1 --forward --directory="$(REPO_DIR_OPENCV)" < \
	  "$(TOOL_DIR)/depends/libmv/0001-Remove-check-for-CMAKE_MODULE_PATH.patch" \

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(BUILD_FILE_LIBMV): $(S)/.prebuild $(LIBMV_BUILD_DEPENDS)
	mkdir -p "$(BUILD_DIR_LIBMV)"

	# Activate PATH and other environment variables in the current terminal and
	# build LIBMV
	. "$(REPO_DIR_EMSDK)/emsdk_set_env.sh" && \
	  cd "${BUILD_DIR_LIBMV}" && \
	  CMAKE_BUILD_PARALLEL_LEVEL=$(shell getconf _NPROCESSORS_ONLN) \
	    emcmake cmake "$(REPO_DIR_LIBMV)/src" \
	      -DCMAKE_INSTALL_PREFIX="$(DEPENDS_DIR)" \
	      -DCMAKE_MODULE_PATH="$(REPO_DIR_LIBMV)/src/CMake/modules" \
	      -DBUILD_TESTS=OFF \
	      -DBUILD_TOOLS=OFF \

	#cmake --build "${BUILD_DIR_LIBMV}"
	make -C "${BUILD_DIR_LIBMV}" -j$(shell getconf _NPROCESSORS_ONLN)

	touch "$@"

$(S)/build-libmv: $(BUILD_FILE_LIBMV)
	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(INSTALL_FILE_LIBMV): $(S)/.preinstall $(S)/build-libmv
	mkdir -p "$(DEPENDS_DIR)"

	cmake \
	  --build "${BUILD_DIR_LIBMV}" \
	  --target install

	touch "$@"

$(S)/install-libmv: $(INSTALL_FILE_LIBMV)
	touch "$@"
