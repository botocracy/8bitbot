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
# Helper to build C++ libraries with Emscripten
#
# Required environment parameters:
#
#   BUILD_DIRECTORY - The directory for intermediate build files
#   EMSDK_DIRECTORY - The directory where the the Emscripten SDK can be found
#   DEPENDS_DIRECTORY - The directory where dependency files were installed
#
################################################################################

# Enable strict shell mode
set -o errexit
set -o nounset
set -o pipefail

# Get the absolute path to this script
SOURCE_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set up Emscripten environment and path variables
. "${EMSDK_DIRECTORY}/emsdk_set_env.sh"

function build_scene_detector() {
  # Compile and link
  emcc --bind -O3 -std=c++11 \
    -I"${DEPENDS_DIRECTORY}/include" \
    "$@" \
    -o "${BUILD_DIRECTORY}/scene_detector.so"
}

function scene_detector() {
  # Generate JavaScript and WASM
  emcc --bind -O3 -s \
    -s TOTAL_MEMORY=67108864 \
    -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
    -lworkerfs.js \
    "${BUILD_DIRECTORY}/scene_detector.so" \
    "$@" \
    -o "${BUILD_DIRECTORY}/scene_detector.js"
}

function build_stream_decoder() {
  # Compile and link
  emcc --bind -O3 -std=c++11 \
    -I"${DEPENDS_DIRECTORY}/include" \
    "$@" \
    -o "${BUILD_DIRECTORY}/stream_decoder.so"
}

function stream_decoder() {
  # Generate JavaScript and WASM
  emcc --bind -O3 -s \
    -s TOTAL_MEMORY=67108864 \
    -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
    -lworkerfs.js \
    "${BUILD_DIRECTORY}/stream_decoder.so" \
    "$@" \
    -o "${BUILD_DIRECTORY}/stream_decoder.js"
}

# Dispatch script
case $1 in
  build_scene_detector)
    shift
    build_scene_detector "$@"
    ;;
  scene_detector)
    shift
    scene_detector "$@"
    ;;
  build_stream_decoder)
    shift
    build_stream_decoder "$@"
    ;;
  stream_decoder)
    shift
    stream_decoder "$@"
    ;;
  *)
    exit 1
    ;;
esac
