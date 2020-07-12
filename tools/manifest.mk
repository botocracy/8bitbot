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
# Dependencies
#
# Variable names for dependencies have the following form:
#
#   - Repo name (xxx_REPO_NAME)
#   - Version tags (xxx_VERSION)
#   - Remote repo path (xxx_REMOTE_REPO)
#   - Name of the generated file (xxx_BIN or xxx_LIB)
#
# TODO: When a version is bumped, update CI configuration:
#
#   - /.github/workflows/node.js.yml
#
################################################################################

# Codecbox.js
CODECBOX_JS_REPO_NAME = codecbox.js
CODECBOX_JS_VERSION = c31de35d32cc9e3f01dd577b3c27df7f24e599ed
CODECBOX_JS_REMOTE_REPO = https://github.com/duanyao/$(CODECBOX_JS_REPO_NAME).git
CODECBOX_JS_LIB = codecbox.js

# Emscripten SDK
EMSDK_REPO_NAME = emsdk
EMSDK_VERSION = 1.39.18
EMSDK_SDK_TOOLS_VERSION = latest-upstream
EMSDK_REMOTE_REPO = https://github.com/emscripten-core/$(EMSDK_REPO_NAME).git
EMSDK_BINARY = emsdk

# OpenCV
OPENCV_REPO_NAME = opencv
OPENCV_VERSION = 4.3.0
OPENCV_REMOTE_REPO = https://github.com/opencv/$(OPENCV_REPO_NAME).git
OPENCV_LIB = opencv.js

# Scene detector
SCENE_DETECTOR_LIB = scene_detector.js

# Cache buster for CI systems
CI_RELEASE = 0
