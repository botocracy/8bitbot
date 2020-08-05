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
# Script to encode a collection of videos into HLS streams
#

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

################################################################################
# Environment parameters
################################################################################

video="${1}"

################################################################################
# HLS parameters
################################################################################

# FFmpeg default is 2 seconds. Apple recommends a segment duration of 6 seconds.
HLS_SEGMENT_TIME_SECS=2

################################################################################
# Build parameters
################################################################################

# Get the absolute path to this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

BUILD_PATH="${SCRIPT_DIR}/build"

################################################################################
# Encode script
################################################################################

# Create build directory
mkdir -p "${BUILD_PATH}"

# Extract filename without extension
filename=$(basename -- "${video}" ".mp4")

# Check if video is already encoded
if [ -d "${BUILD_PATH}/${filename}" ]; then
  echo "Skipping encoding of ${video}"
else
  echo "Encoding ${video}"

  # Create a folder for the video
  mkdir -p "${BUILD_PATH}/${filename}"

  # Convert the video
  ffmpeg -i "${video}" \
    -f hls \
    -profile:v main \
    -level 3.0 \
    -start_number 0 \
    -hls_time ${HLS_SEGMENT_TIME_SECS} \
    -hls_list_size 0 \
    "${BUILD_PATH}/${filename}/index.m3u8"
fi
