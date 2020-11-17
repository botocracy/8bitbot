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

// Library for using console.log
import 'hardhat/console.sol';

import '../src/Ownable.sol';

contract TestOwnable is Ownable {
  constructor(address _owner) public Ownable(_owner) {}

  function externalOnlyOwner() external view onlyOwner returns (bool) {
    return true;
  }

  function testTransferOwnership(address newOwner) external {
    console.log(
      'Transferring ownership from %s to %s',
      toAsciiString(owner),
      toAsciiString(newOwner)
    );

    super.transferOwnership(newOwner);
  }

  // "Convert address to string"
  // https://ethereum.stackexchange.com/questions/8346/convert-address-to-string
  function toAsciiString(address x) internal pure returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint256 i = 0; i < 20; i++) {
      bytes1 b = bytes1(uint8(uint256(x) / (2**(8 * (19 - i)))));
      bytes1 hi = bytes1(uint8(b) / 16);
      bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
      s[2 * i] = char(hi);
      s[2 * i + 1] = char(lo);
    }
    return string(s);
  }

  function char(bytes1 b) internal pure returns (bytes1 c) {
    if (uint8(b) < 10) {
      return bytes1(uint8(b) + 0x30);
    } else {
      return bytes1(uint8(b) + 0x57);
    }
  }
}
