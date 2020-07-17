#!/bin/bash
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
# Helper for CI infrastructure. Sets the appropriate paths and calls CMake.
#
################################################################################

# Enable strict shell mode
set -o errexit
set -o nounset
set -o pipefail

#
# Environment paths
#

# Get the absolute path to this script
SOURCE_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Directory of the depends build system
TOOL_DIRECTORY="${SOURCE_DIRECTORY}/../tools"

# Directory for intermediate build files
BUILD_DIRECTORY="${TOOL_DIRECTORY}/build/cpp-libs"

# Directory of the Emscripten SDK
EMSDK_DIRECTORY="${TOOL_DIRECTORY}/repos/emsdk"

# Directory of the installed dependency files
DEPENDS_DIRECTORY="${TOOL_DIRECTORY}/dist"

# Directory to place the generated libraries
INSTALL_DIRECTORY="${SOURCE_DIRECTORY}/../public"

# Ensure directories exist
mkdir -p "${BUILD_DIRECTORY}"
mkdir -p "${INSTALL_DIRECTORY}"

#
# Call CMake
#

cd "${BUILD_DIRECTORY}"

cmake \
  "${SOURCE_DIRECTORY}" \
  -DEMSDK_DIRECTORY="${EMSDK_DIRECTORY}" \
  -DDEPENDS_DIRECTORY="${DEPENDS_DIRECTORY}" \
  -DCMAKE_INSTALL_PREFIX="${INSTALL_DIRECTORY}"

cmake --build "${BUILD_DIRECTORY}" --target install
