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
# Utility functions for NPM scripting
#

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

#
# Helper function
#
# Usage:
#
#   patch_package <package name> <patch name>
#
function patch_package() {
  package=$1
  patch=$2

  package_path="node_modules/${package}"
  patch_path="tools/depends/${package}/${patch}"

  # Can't discern between missing patch and already-applied patch
  if [ ! -f "${patch_path}" ]; then
    echo "Missing ${patch}!"
    exit 1
  fi

  echo "Patching: ${package_path}"

  patch -p1 --forward --directory="${package_path}" <"${patch_path}" || (
    code=$?
    [[ "${code}" -lt "2" ]] || exit ${code}
  )
}
