/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

pragma solidity ^0.6.11;

// Library for using console.log
import 'hardhat/console.sol';

contract Token {
  // Token identity
  string public name = 'My Hardhat Token';
  string public symbol = 'MHT';

  // The fixed amount of tokens
  uint256 public totalSupply = 1000000;

  // Ethereum account
  address public owner;

  // Account balances
  mapping(address => uint256) balances;

  /**
   * Contract initialization
   */
  constructor() public {
    // The totalSupply is assigned to transaction sender, which is the account
    // that is deploying the contract
    balances[msg.sender] = totalSupply;
    owner = msg.sender;
  }

  /**
   * A function to transfer tokens
   */
  function transfer(address to, uint256 amount) external {
    // Check if the transaction sender has enough tokens. If `require`'s
    // first argument evaluates to `false` then the transaction will
    // revert.
    require(balances[msg.sender] >= amount, 'Not enough tokens');

    // Print messages and values using console.log
    console.log('Transferring from %s to %s %s tokens', msg.sender, to, amount);

    // Transfer the amount
    balances[msg.sender] -= amount;
    balances[to] += amount;
  }

  /**
   * Read-only function to retrieve the token balance of a given account
   */
  function balanceOf(address account) external view returns (uint256) {
    return balances[account];
  }
}
