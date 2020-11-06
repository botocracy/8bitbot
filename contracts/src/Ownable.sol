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

contract Ownable is IOwnable {
  /// @dev The owner of this contract.
  /// @return 0 The owner address.
  address public override owner;

  constructor(address _owner) public {
    owner = _owner;
  }

  modifier onlyOwner() {
    _assertSenderIsOwner();
    _;
  }

  /// @dev Change the owner of this contract.
  /// @param newOwner New owner address.
  function transferOwnership(address newOwner) public override onlyOwner {
    if (newOwner == address(0)) {
      revert("Can't transfer to address 0");
    } else {
      owner = newOwner;
      emit OwnershipTransferred(msg.sender, newOwner);
    }
  }

  function _assertSenderIsOwner() internal view {
    if (msg.sender != owner) {
      revert('Sender is not the owner');
    }
  }
}
