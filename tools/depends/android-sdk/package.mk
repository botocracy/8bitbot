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
# Checkout
#
################################################################################

$(S)/checkout-android-sdk: $(S)/.precheckout
	mkdir -p "$(REPO_DIR_ANDROID_SDK)"

	[ -f "$(REPO_DIR)/android-sdk-macos-4.0.zip" ] || \
	  curl --silent "https://dl.google.com/android/repository/commandlinetools-mac-6609375_latest.zip" \
	  > "$(REPO_DIR)/android-sdk-macos-4.0.zip"

	unzip -q -n "$(REPO_DIR)/android-sdk-macos-4.0.zip" \
	  -d "$(REPO_DIR_ANDROID_SDK)"

	cd "$(REPO_DIR_ANDROID_SDK)/tools/bin" && \
	  yes | ./sdkmanager --sdk_root="`pwd`/../.." --licenses && \
	  ./sdkmanager --sdk_root="`pwd`/../.." platform-tools && \
	  ./sdkmanager --sdk_root="`pwd`/../.." "platforms;android-28" && \
	  ./sdkmanager --sdk_root="`pwd`/../.." "build-tools;28.0.3"

	touch "$@"
