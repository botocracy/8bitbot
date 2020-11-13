/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import * as ethersTypes from 'ethers';
import { ethers } from 'hardhat';

describe('Ownable contract', function () {
  let TestOwnable: ethersTypes.ContractFactory;
  let testOwnable: ethersTypes.Contract;
  let owner: any; // TODO: SignerWithAddress
  let nonOwner: any; // TODO: SignerWithAddress

  // Before each test, re-deploy the contract every time
  beforeEach(async function () {
    // Get the ContractFactory and Signers
    TestOwnable = await ethers.getContractFactory('TestOwnable');
    [owner, nonOwner] = await ethers.getSigners();

    // Deploy the contract and wait for the transaction to be mined
    testOwnable = await TestOwnable.deploy();
    await testOwnable.deployed();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      // Expect the owner variable stored in the contract to be equal to the
      // Signer's owner
      chai.expect(await testOwnable.owner()).to.equal(owner.address);
    });
  });

  describe('Transactions', function () {
    it('Should test externalOnlyOwner()', async function () {
      chai.expect(await testOwnable.externalOnlyOwner()).to.be.true;
    });
  });
});
