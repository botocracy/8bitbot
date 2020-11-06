/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * This file is derived from the 0x Monorepo, available under the
 * Apache 2.0 license. https://github.com/0xProject/0x-monorepo
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

pragma solidity ^0.6.11;

library LibRichErrors {
  // bytes4(keccak256("Error(string)"))
  bytes4 internal constant STANDARD_ERROR_SELECTOR = 0x08c379a0;

  // solhint-disable func-name-mixedcase
  /// @dev ABI encode a standard, string revert error payload.
  ///      This is the same payload that would be included by a `revert(string)`
  ///      solidity statement. It has the function signature `Error(string)`.
  /// @param message The error string.
  /// @return The ABI encoded error.
  function StandardError(string memory message)
    internal
    pure
    returns (bytes memory)
  {
    return abi.encodeWithSelector(STANDARD_ERROR_SELECTOR, bytes(message));
  }

  // solhint-enable func-name-mixedcase

  /// @dev Reverts an encoded rich revert reason `errorData`.
  /// @param errorData ABI encoded error data.
  function rrevert(bytes memory errorData) internal pure {
    assembly {
      revert(add(errorData, 0x20), mload(errorData))
    }
  }
}
