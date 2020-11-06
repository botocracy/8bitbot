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

import './interfaces/IOwnable.sol';
import './errors/LibRichErrors.sol';
import './errors/LibOwnableRichErrors.sol';

contract Ownable is IOwnable {
  /// @dev The owner of this contract.
  /// @return 0 The owner address.
  address public override owner;

  constructor() public {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    _assertSenderIsOwner();
    _;
  }

  /// @dev Change the owner of this contract.
  /// @param newOwner New owner address.
  function transferOwnership(address newOwner) public override onlyOwner {
    if (newOwner == address(0)) {
      LibRichErrors.rrevert(LibOwnableRichErrors.TransferOwnerToZeroError());
    } else {
      owner = newOwner;
      emit OwnershipTransferred(msg.sender, newOwner);
    }
  }

  function _assertSenderIsOwner() internal view {
    if (msg.sender != owner) {
      LibRichErrors.rrevert(
        LibOwnableRichErrors.OnlyOwnerError(msg.sender, owner)
      );
    }
  }
}
