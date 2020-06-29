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

# Emscripten SDK
EMSDK_REPO_NAME = emsdk
EMSDK_VERSION = 1.39.18
EMSDK_SDK_TOOLS_VERSION = sdk-fastcomp-1.38.31-64bit # Or "latest" or "latest-upstream"
EMSDK_REMOTE_REPO = https://github.com/emscripten-core/$(EMSDK_REPO_NAME).git
EMSDK_BINARY = emsdk

# OpenCV
OPENCV_REPO_NAME = opencv
OPENCV_VERSION = 4.3.0
OPENCV_REMOTE_REPO = https://github.com/opencv/$(OPENCV_REPO_NAME).git
OPENCV_LIB = opencv.js
