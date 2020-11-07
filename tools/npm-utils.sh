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

  patch \
    -p1 \
    --forward \
    --directory="${package_path}" \
    --reject-file="/dev/null" \
    --no-backup-if-mismatch \
    < "${patch_path}" || \
    :

  echo
}

#
# Helper function
#
# Usage:
#
#   patch_package_recursive <package name> <patch name>
#
# To prevent conflicts of nested dependencies, the nested package versions can
# be controlled using the "resolutions" field in package.json.
#
function patch_package_recursive() {
  package=$1
  patch=$2

  patch_path="tools/depends/${package}/${patch}"

  # Can't discern between missing patch and already-applied patch
  if [ ! -f "${patch_path}" ]; then
    echo "Missing ${patch}!"
    exit 1
  fi

  for package_path in $(find "node_modules" -name "${package}" -type d); do
    # Skip rollup polyfills
    if echo "${package_path}" | grep --quiet rollup-plugin-node-polyfills; then
      continue
    fi

    # Skip type declarations
    if echo "${package_path}" | grep --quiet "@types/${package}"; then
      continue
    fi

    echo "Patching: ${package_path}"

    patch \
      -p1 \
      --forward \
      --directory="${package_path}" \
      --reject-file="/dev/null" \
      --no-backup-if-mismatch \
      < "${patch_path}" || \
      :

    echo
  done
}

#
# Helper function
#
# Usage:
#
#   rm_dist <package name>
#
# Removes the "dist" folder of the given package, recursively.
#
function rm_dist() {
  package=$1

  for package_path in $(find "node_modules" -name "${package}" -type d); do
    # Skip rollup polyfills
    if echo "${package_path}" | grep --quiet rollup-plugin-node-polyfills; then
      continue
    fi

    # Skip type declarations
    if echo "${package_path}" | grep --quiet "@types/${package}"; then
      continue
    fi

    # Skip packages with no dist folder
    if [ ! -d "${package_path}/dist" ]; then
      echo "Already removed dist: ${package_path}"
      echo
      continue
    fi

    echo "Removing dist: ${package_path}"
    rm -rf "${package_path}/dist"
    echo
  done
}
