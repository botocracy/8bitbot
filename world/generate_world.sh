#!/bin/bash
################################################################################
#
#  Copyright (C) 2019 botocracy
#  This file is part of 8 Bit Bot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: MIT
#  See the file LICENSING for more information.
#
################################################################################

#
# Script to generate the game world
#

################################################################################
# Build parameters
################################################################################

# Get the absolute path to this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

BUILD_PATH="${SCRIPT_DIR}/build"

# Create build directory
mkdir -p "${BUILD_PATH}"

################################################################################
# Media
################################################################################

# Copy MP4s
cp mp4/* "${BUILD_PATH}"

# Generate HLS
./hls_encode.sh

################################################################################
# Linked Data
################################################################################

cp graph.json "${BUILD_PATH}"
