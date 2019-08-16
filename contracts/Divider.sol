/**
 * Copyright (C) 2019 botocracy
 * This file is part of 8 Bit Bot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: MIT
 * See the file LICENSE for more information.
 *
 * @summary: Divides funds evenly between two addresses
 * @author: botocracy
 */
pragma solidity ^0.5.11;

import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title: Contract to divide funds evenly between two addresses 
 */
contract Divider {
  using SafeMath for uint256;

  /**
   * @dev: Divide funds
   * @param _a The first address to receive half the funds
   * @param _b The second address to receive half the funds
   * @note We do integer division (floor(x/2)) when calculating each output,
   * because Solidity doesn't have a decimal number type. This means there
   * will be a maximum of count - 1 Wei locked in the contract. We ignore
   * this because it is such a small amount of Ethereum (1 Wei =
   * 10^(-18) Ether, or an "atto-ether").
   */
  function divideFunds(address _a, address _b) public payable {
    uint256 halfValue = msg.value.div(2)
    _a.transfer(halfValue)
    _b.transfer(halfValue)
  }
}
