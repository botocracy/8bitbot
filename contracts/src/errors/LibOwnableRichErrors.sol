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

library LibOwnableRichErrors {
  // bytes4(keccak256("OnlyOwnerError(address,address)"))
  bytes4 internal constant ONLY_OWNER_ERROR_SELECTOR = 0x1de45ad1;

  // bytes4(keccak256("TransferOwnerToZeroError()"))
  bytes internal constant TRANSFER_OWNER_TO_ZERO_ERROR_BYTES = hex'e69edc3e';

  // solhint-disable func-name-mixedcase
  function OnlyOwnerError(address sender, address owner)
    internal
    pure
    returns (bytes memory)
  {
    return abi.encodeWithSelector(ONLY_OWNER_ERROR_SELECTOR, sender, owner);
  }

  function TransferOwnerToZeroError() internal pure returns (bytes memory) {
    return TRANSFER_OWNER_TO_ZERO_ERROR_BYTES;
  }
}
