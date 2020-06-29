################################################################################
#
# Build chain for dependendies
#
# Make is used to run shell commands instead of bash to allow for parallel
# intermediary build stages.
#
# The primary build stages that can be specified on the command line are:
#
#   1. checkout
#   2. build
#   3. install (default if no stage is given)
#
# Two stages are used for cleaning temoprary files:
#
#   1. clean
#   2. distclean
#
# "make clean" is used to remove temporary build artifacts. "make distclean" is
# used to remove all temporary files and reset the directory to an unused state.
#
################################################################################

# Dependency definitions
include manifest.mk

# Build system setup
include setup_paths.mk
include setup_stages.mk

################################################################################
#
# Build system paths
#
################################################################################

# Checkout stage
REPO_DIR_EMSDK = $(REPO_DIR)/$(EMSDK_REPO_NAME)
REPO_DIR_OPENCV = $(REPO_DIR)/$(OPENCV_REPO_NAME)

# Build stage
BUILD_DIR_EMSDK = $(BUILD_DIR)/$(EMSDK_REPO_NAME)
BUILD_DIR_OPENCV = $(BUILD_DIR)/$(OPENCV_REPO_NAME)
BUILD_FILE_OPENCV = $(BUILD_DIR_OPENCV)/bin/$(OPENCV_LIB)

# Install stage
INSTALL_FILE_OPENCV = $(INSTALL_DIR)/$(OPENCV_LIB)

################################################################################
#
# Build system procedures
#
################################################################################

# Shorten variable name for Makefile stamp idiom
S = $(STAMP_DIR)

#
# Checkout stage
#
checkout: $(S)/checkout-emsdk $(S)/checkout-opencv

$(S)/precheckout: manifest.mk
	mkdir -p "$(S)"
	mkdir -p "$(REPO_DIR)"

	touch "$@"

$(S)/checkout-emsdk: $(S)/precheckout
	[ -d "$(REPO_DIR_EMSDK)" ] || git clone -b $(EMSDK_VERSION) "$(EMSDK_REMOTE_REPO)" "$(REPO_DIR_EMSDK)"

	@# TODO: Repository sync is delegated to the CI system.

	# Download and install the latest SDK tools.
	cd "$(REPO_DIR_EMSDK)" && \
	  "$(REPO_DIR_EMSDK)/emsdk" install $(EMSDK_SDK_TOOLS_VERSION)

	touch "$@"

$(S)/checkout-opencv: $(S)/precheckout
	[ -d "$(REPO_DIR_OPENCV)" ] || git clone -b $(OPENCV_VERSION) "$(OPENCV_REMOTE_REPO)" "$(REPO_DIR_OPENCV)"

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

#
# Build stage
#
build: $(BUILD_FILE_OPENCV)

$(S)/prebuild: manifest.mk
	mkdir -p "$(S)"
	mkdir -p "$(BUILD_DIR)"

	touch "$@"

$(S)/build-emsdk: $(S)/prebuild $(S)/checkout-emsdk
	# Make SDK "active" for the current user (writes .emscripten file)
	cd "$(REPO_DIR_EMSDK)" && \
	  "$(REPO_DIR_EMSDK)/emsdk" activate $(EMSDK_SDK_TOOLS_VERSION)

	# Create an evironment setup script
	cd "$(REPO_DIR_EMSDK)" && \
	  "$(REPO_DIR_EMSDK)/emsdk" construct_env

	touch "$@"

$(BUILD_FILE_OPENCV): $(S)/prebuild $(S)/checkout-opencv $(S)/build-emsdk
	mkdir -p "$(BUILD_DIR_OPENCV)"

	# Activate PATH and other environment variables in the current terminal and
	# build OpenCV
	. "$(REPO_DIR_EMSDK)/emsdk_set_env.sh" && \
	  python3 "$(REPO_DIR_OPENCV)/platforms/js/build_js.py" "$(BUILD_DIR_OPENCV)"

	touch "$@"

#
# Install stage
#
install: $(INSTALL_FILE_OPENCV)

$(S)/preinstall: manifest.mk
	mkdir -p "$(S)"
	mkdir -p "$(INSTALL_DIR)"

	touch "$@"

$(INSTALL_FILE_OPENCV): $(S)/preinstall $(BUILD_FILE_OPENCV) patches/0001-temp-Hack-opencv.js-to-ES6.patch
	mkdir -p "$(INSTALL_DIR)"

	# Copy generated files
	cp "$(BUILD_FILE_OPENCV)" "$(INSTALL_FILE_OPENCV)"

	# Hack in ES6 support
	patch -d "$(INSTALL_DIR)" < "patches/0001-temp-Hack-opencv.js-to-ES6.patch"

#
# Clean stage
#
clean:
	rm -rf "$(BUILD_DIR)"
	rm -rf "$(S)"

#
# Distclean stage
#
distclean: clean
	rm -rf "$(REPO_DIR)"
