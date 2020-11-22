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
# Node Version Manager
#
# SPDX-License-Identifier: MIT
#
################################################################################

# Dependency name and version
NVM_REPO_NAME = nvm
NVM_VERSION = 0.37.0
NVM_INSTALL_SCRIPT = https://raw.githubusercontent.com/nvm-sh/$(NVM_REPO_NAME)/v$(NVM_VERSION)/install.sh
NVM_BIN = nvm-exec

################################################################################
#
# Paths
#
################################################################################

# Checkout directory
REPO_DIR_NVM = $(REPO_DIR)/$(NVM_REPO_NAME)

# Downloaded binary
NVM_BIN_PATH = $(REPO_DIR_NVM)/$(NVM_BIN)

################################################################################
#
# Checkout
#
################################################################################

$(NVM_BIN_PATH): $(S)/.precheckout
	mkdir -p "$(REPO_DIR_NVM)"

	[ -f "$(NVM_BIN_PATH)" ] || ( \
	  wget -qO- "$(NVM_INSTALL_SCRIPT)" | \
	    NVM_DIR="$(REPO_DIR_NVM)" \
	    PROFILE="/dev/null" \
	    bash \
	)

	@# TODO: Repository sync is delegated to the CI system.

	touch "$@"

$(S)/checkout-nvm: $(NVM_BIN_PATH)
	touch "$@"
