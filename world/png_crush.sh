#!/bin/sh
################################################################################
#
#  Copyright (C) 2019 botocracy
#  This file is part of 8 Bit Bot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: MIT
#  See DOCS/LICENSING.md for more information.
#
################################################################################

#
# Dependencies:
#
#   pngcrush
#     - sudo apt-get install pngcrush
#

for png in `find . -name "*.png"`;
do
  echo "crushing $png"
  pngcrush -brute -ow "$png"
done
