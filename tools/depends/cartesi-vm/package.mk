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
# Cartesi RISC-V Solidity Emulator
#
# The on-chain implementation of the Cartesi Machine.
#
# SPDX-License-Identifier: Apache-2.0
#
################################################################################

# Dependency name and version
CARTESI_VM_REPO_NAME = machine-solidity-step
CARTESI_VM_VERSION = v0.5.0
CARTESI_VM_REMOTE_REPO = https://github.com/cartesi/$(CARTESI_VM_REPO_NAME).git
#CARTESI_VM_LIB = libcartesi-vm.a

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_CARTESI_VM = $(REPO_DIR)/cartesi-vm

# Build directory
BUILD_DIR_CARTESI_VM = $(BUILD_DIR)/cartesi-vm

################################################################################
#
# Configuration
#
################################################################################

CARTESI_VM_BUILD_DEPENDS = \
  $(S)/checkout-cartesi-vm \

CARTESI_VM_TEST_DEPENDS = \
  $(S)/build-cartesi-vm \

CARTESI_VM_INSTALL_DEPENDS = \
  $(S)/test-cartesi-vm \

################################################################################
#
# Checkout
#
################################################################################

$(S)/checkout-cartesi-vm: $(S)/.precheckout
	[ -d "$(REPO_DIR_CARTESI_VM)" ] || ( \
	  git clone -b "$(CARTESI_VM_VERSION)" "$(CARTESI_VM_REMOTE_REPO)" "$(REPO_DIR_CARTESI_VM)" \
	)

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

################################################################################
#
# Build
#
################################################################################

$(S)/build-cartesi-vm: $(S)/.prebuild $(CARTESI_VM_BUILD_DEPENDS)
	[ -d "$(BUILD_DIR_CARTESI_VM)" ] || ( \
	  git clone -b "$(CARTESI_VM_VERSION)" "$(REPO_DIR_CARTESI_VM)" "$(BUILD_DIR_CARTESI_VM)" \
	)

	@# TODO

	touch "$@"

################################################################################
#
# Test
#
################################################################################

$(S)/test-cartesi-vm: $(S)/.preinstall $(CARTESI_VM_TEST_DEPENDS)
	#cd "$(BUILD_DIR_CARTESI_VM)" && \
	#  `# Run step tests with docker` \
	#  docker build . -t cartesi/step-test -f Dockerfile.step && \
	#  docker run cartesi/step-test

	#cd "$(BUILD_DIR_CARTESI_VM)" && \
	#  `# Run ram tests with docker` \
	#  docker build . -t cartesi/ramam-test -f Dockerfile.ram && \
	#  docker run cartesi/ram-test

	touch "$@"

################################################################################
#
# Install
#
################################################################################

$(S)/install-cartesi-vm: $(S)/.preinstall $(CARTESI_VM_INSTALL_DEPENDS)
	mkdir -p "$(CONTRACTS_DIR)/cartesi-vm"

	cp -r "$(BUILD_DIR_CARTESI_VM)/contracts"/* "$(CONTRACTS_DIR)/cartesi-vm"

	touch "$@"
