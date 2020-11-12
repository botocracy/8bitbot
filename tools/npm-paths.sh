#!/bin/bash
################################################################################
#
#  Copyright (C) 2019-2020 Marquise Stein
#  This file is part of 8bitbot - https://github.com/botocracy/8bitbot
#
#  SPDX-License-Identifier: Apache-2.0
#  See the file LICENSES/README.md for more information.
#
################################################################################

#
# Paths for NPM scripts
#
# Import via:
#
#   source npm-paths.sh
#

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

#
# Directory definitions
#

# Typescript/Javascript source directory
SOURCE_DIR="src"

# Directory for generated source
GENERATED_SOURCE_DIR="${SOURCE_DIR}/generated"

# Tooling directory
TOOL_DIR="tools"

# Depends directory
DEPENDS_DIR="${TOOL_DIR}/depends"

# Build system stamp directory
STAMP_DIR="${TOOL_DIR}/stamps"
