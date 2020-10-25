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

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// Example class - a mock class using delivering from ERC20
contract BasicToken is ERC20 {
  constructor(uint256 initialBalance) public ERC20('Basic', 'BSC') {
    _mint(msg.sender, initialBalance);
  }
}
