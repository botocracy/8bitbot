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

interface IOwnable {
  /// @dev Emitted by Ownable when ownership is transferred.
  /// @param previousOwner The previous owner of the contract.
  /// @param newOwner The new owner of the contract.
  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  /// @dev Transfers ownership of the contract to a new address.
  /// @param newOwner The address that will become the owner.
  function transferOwnership(address newOwner) external;

  /// @dev The owner of this contract.
  /// @return ownerAddress The owner address.
  function owner() external view returns (address ownerAddress);
}
