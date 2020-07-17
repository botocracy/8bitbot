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
# Build system for C++ libraries
#
# Required environment parameters:
#
#   EMSDK_DIRECTORY - The directory where the the Emscripten SDK can be found
#   DEPENDS_DIRECTORY - The directory where dependency files were installed
#
# Required CMake variables:
#
#   CMAKE_INSTALL_PREFIX - Point this to the "public" folder
#
################################################################################

project(8bitbot)

cmake_minimum_required(VERSION 3.0.0)

################################################################################
#
# Define sources
#
# Absolute paths are required for the emscripten-helper.sh script. In the
# future, the script should be removed and Emscripten parameters passed
# directly to CMake.
#
################################################################################

#
# Common
#

set(COMMON_SOURCES
  "${CMAKE_SOURCE_DIR}/common/image_data.cpp"
)

#
# Scene detector
#

set(SCENE_DETECTOR_SOURCES
  "${COMMON_SOURCES}"
  "${CMAKE_SOURCE_DIR}/scene_detector/scene_detector.cpp"
  "${CMAKE_SOURCE_DIR}/scene_detector/scene_detector_embinder.cpp"
)

set(SCENE_DETECTOR_LIBRARIES
  "${DEPENDS_DIRECTORY}/lib/libavutil.a"
  #"${DEPENDS_DIRECTORY}/lib/libopenh264.so"
  #"${DEPENDS_DIRECTORY}/lib/libx264.so"
)

#
# Stream decoder
#

set(STREAM_DECODER_SOURCES
  "${COMMON_SOURCES}"
  "${CMAKE_SOURCE_DIR}/stream_decoder/stream_decoder.cpp"
  "${CMAKE_SOURCE_DIR}/stream_decoder/stream_decoder_embinder.cpp"
)

set(STREAM_DECODER_LIBRARIES
  "${DEPENDS_DIRECTORY}/lib/libavutil.a"
  #"${DEPENDS_DIRECTORY}/lib/libopenh264.so"
  #"${DEPENDS_DIRECTORY}/lib/libx264.so"
)

################################################################################
#
# Build libraries
#
# TODO:
#
#   * Build properly instead of shelling out
#   * Could refactor this into macros
#
################################################################################

# Emscripten helper script that we shell out to
set(EMSCRIPTEN_HELPER "${CMAKE_SOURCE_DIR}/emscripten-helper.sh")

#
# Scene detector
#

add_custom_command(
  OUTPUT
    scene_detector.so
  COMMAND
    ${CMAKE_COMMAND} -E env
      BUILD_DIRECTORY="${CMAKE_BINARY_DIR}"
      EMSDK_DIRECTORY="${EMSDK_DIRECTORY}"
      DEPENDS_DIRECTORY="${DEPENDS_DIRECTORY}"
      "${EMSCRIPTEN_HELPER}" build_scene_detector ${SCENE_DETECTOR_SOURCES}
  DEPENDS
    ${SCENE_DETECTOR_SOURCES}
    "${EMSCRIPTEN_HELPER}"
  COMMENT "Building scene_detector"
)

add_custom_target(build_scene_detector ALL
  DEPENDS
    scene_detector.so
  SOURCES
    ${SCENE_DETECTOR_SOURCES}
)

add_custom_command(
  OUTPUT
    scene_detector.js
    scene_detector.wasm
  COMMAND
    ${CMAKE_COMMAND} -E env
      BUILD_DIRECTORY="${CMAKE_BINARY_DIR}"
      EMSDK_DIRECTORY="${EMSDK_DIRECTORY}"
      DEPENDS_DIRECTORY="${DEPENDS_DIRECTORY}"
      "${EMSCRIPTEN_HELPER}" scene_detector ${SCENE_DETECTOR_LIBRARIES}
  DEPENDS
    "${CMAKE_BINARY_DIR}/scene_detector.so"
    "${EMSCRIPTEN_HELPER}"
  COMMENT "Generating JavaScript/WASM for scene_detector"
)

add_custom_target(scene_detector ALL
  DEPENDS
    scene_detector.js
    scene_detector.wasm
)

add_dependencies(scene_detector
  build_scene_detector
)

#
# Stream decoder
#

add_custom_command(
  OUTPUT
    stream_decoder.so
  COMMAND
    ${CMAKE_COMMAND} -E env
      BUILD_DIRECTORY="${CMAKE_BINARY_DIR}"
      EMSDK_DIRECTORY="${EMSDK_DIRECTORY}"
      DEPENDS_DIRECTORY="${DEPENDS_DIRECTORY}"
      "${EMSCRIPTEN_HELPER}" build_stream_decoder ${STREAM_DECODER_SOURCES}
  DEPENDS
    ${STREAM_DECODER_SOURCES}
    "${EMSCRIPTEN_HELPER}"
  COMMENT "Building stream_decoder"
)

add_custom_target(build_stream_decoder ALL
  DEPENDS
    stream_decoder.so
  SOURCES
    ${STREAM_DECODER_SOURCES}
)

add_custom_command(
  OUTPUT
    stream_decoder.js
    stream_decoder.wasm
  COMMAND
    ${CMAKE_COMMAND} -E env
      BUILD_DIRECTORY="${CMAKE_BINARY_DIR}"
      EMSDK_DIRECTORY="${EMSDK_DIRECTORY}"
      DEPENDS_DIRECTORY="${DEPENDS_DIRECTORY}"
      "${EMSCRIPTEN_HELPER}" stream_decoder ${STREAM_DECODER_LIBRARIES}
  DEPENDS
    "${CMAKE_BINARY_DIR}/stream_decoder.so"
    "${EMSCRIPTEN_HELPER}"
  COMMENT "Generating JavaScript/WASM for stream_decoder"
)

add_custom_target(stream_decoder ALL
  DEPENDS
    stream_decoder.js
    stream_decoder.wasm
)

add_dependencies(stream_decoder
  build_stream_decoder
)

################################################################################
#
# Install libraries
#
################################################################################

#
# Scene detector
#

INSTALL(
  FILES
    "${CMAKE_BINARY_DIR}/scene_detector.js"
    "${CMAKE_BINARY_DIR}/scene_detector.wasm"
  DESTINATION
    scene_detector
)

#
# Stream decoder
#

INSTALL(
  FILES
    "${CMAKE_BINARY_DIR}/stream_decoder.js"
    "${CMAKE_BINARY_DIR}/stream_decoder.wasm"
  DESTINATION
    stream_decoder
)
