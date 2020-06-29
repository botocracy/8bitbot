################################################################################
#
# Set paths for build system early setup
#
################################################################################

# Directory for tooling
TOOL_DIR = $(shell pwd)

# Directory of stamps for tracking build progress
STAMP_DIR = $(TOOL_DIR)/stamps

# Directory for storing dependency repositories
REPO_DIR = $(TOOL_DIR)/repos

# Directory of building dependencies
BUILD_DIR = $(TOOL_DIR)/build

# Directory to place generated files
INSTALL_DIR = $(TOOL_DIR)/../src/generated

# Stamp files for build system stages
CHECKOUT_DONE = $(STAMP_DIR)/.checkout-done
BUILD_DONE = $(STAMP_DIR)/.build-done
INSTALL_DONE = $(STAMP_DIR)/.install-done
