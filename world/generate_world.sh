#!/bin/bash
################################################################################
#
#  Copyright (C) 2019 botocracy
#  This file is part of 8 Bit Bot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: MIT
#  See the file LICENSING for more information.
#
################################################################################

#
# Script to generate the game world
#

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

################################################################################
# Build parameters
################################################################################

# Get the absolute path to this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Directory containing the MP4s
SOURCE_DIR=mp4

BUILD_PATH="${SCRIPT_DIR}/build"

# Create build directory
mkdir -p "${BUILD_PATH}"

################################################################################
# Media
################################################################################

# Copy MP4s
for video in "${SOURCE_DIR}"/*; do
  # Extract filename without extension
  filename=$(basename -- "${video}")

  # Check if video is already encoded
  if [ -f "${BUILD_PATH}/${filename}" ]; then
    echo "Skipping copy of ${video}"
  else
    cp -v "${video}" "${BUILD_PATH}"
  fi

  # Generate HLS
  ./hls_encode.sh "${video}"
done

################################################################################
# Linked Data
################################################################################

cp graph.json "${BUILD_PATH}"

################################################################################
# Avatars
################################################################################

# TODO: Clone and update https://github.com/kodi-game/OpenGameArt.org.git

# Run generate step
#python3 OpenGameArt.org/generate.py

# Avatars:

cat <<EOF
Android: Good
Cat Ninja: Good, not bot
Chef: Good, not bot, 3 skin tones
Dark Elf: Good, not bot
Enemies: 4 good, not bots
Gentleman Spy: Good, not bot
Green Robot: Good
Gum Bot: Bad, 32x32
Hero and Baddies: Good, 2 bots
JellyBot: Good, 3 bots
Mage: Good, not bot
Mechanic: Wrong size
Mr. Man: Good, not bot
Ninja: Bad size, has sword
Pirate: Bad size
Princess Sera and Bushly: 1 good enemy, princess is wrong size
Rabbit: Bad size
Ranger: Maybe good, needs cropping
Raven: Good, not bot
Samurai: Bad size
Viking Maiden: Bad size

Bots:
Android (1)
Green Robot (1)
Hero and Baddies (2 meh)
JellyBot (3 meh)

Non-bots:
Cat Ninja (1)
Dark Elf (1)
Enemies: (4)
Gentleman Spy:: (1)
Mage (1)
Mr. Man (1)
Bushly (1)
Raven (1)

EOF
