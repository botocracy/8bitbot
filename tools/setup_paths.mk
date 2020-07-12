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
# Set paths for build system early setup
#
################################################################################

# Directory for tooling
TOOL_DIR = $(shell pwd)

# Directory of stamps for tracking build progress
STAMP_DIR = $(TOOL_DIR)/stamps

# Shorten variable name for Makefile stamp idiom
S = $(STAMP_DIR)

# Directory for storing dependency repositories
REPO_DIR = $(TOOL_DIR)/repos

# Directory of building dependencies
BUILD_DIR = $(TOOL_DIR)/build

# Directory to find sources to compile
LIB_DIR = $(TOOL_DIR)/../lib

# Directory to place generated files
INSTALL_DIR = $(TOOL_DIR)/../src/generated

# Root directory of the web server
PUBLIC_DIR = $(TOOL_DIR)/../public

# Stamp files for build system stages
CHECKOUT_DONE = $(STAMP_DIR)/.checkout-done
BUILD_DONE = $(STAMP_DIR)/.build-done
INSTALL_DONE = $(STAMP_DIR)/.install-done
