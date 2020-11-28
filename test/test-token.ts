/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import chai from 'chai';
import * as ethers from 'ethers';
import { hardhat } from '../src/web3/hardhat';

describe('Token contract', function () {
  let Token: ethers.ContractFactory;
  let hardhatToken: ethers.Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  // Before each test, re-deploy the contract every time
  beforeEach(async function () {
    // Get the ContractFactory and Signers
    Token = await hardhat.ethers.getContractFactory(
      'contracts/src/Token.sol:Token'
    );
    [owner, addr1, addr2, ...addrs] = await hardhat.ethers.getSigners();

    // Deploy the contract and wait for the transaction to be mined
    hardhatToken = await Token.deploy();
    await hardhatToken.deployed();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      // Expect the owner variable stored in the contract to be equal to the
      // Signer's owner
      chai.expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await hardhatToken.balanceOf(owner.address);

      chai.expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      // Transfer 50 tokens from owner to addr1
      await hardhatToken.transfer(addr1.address, 50);
      const addr1Balance = await hardhatToken.balanceOf(addr1.address);
      chai.expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2. Use .connect(signer) to send
      // a transaction from another account
      await hardhatToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await hardhatToken.balanceOf(addr2.address);
      chai.expect(addr2Balance).to.equal(50);
    });

    it('Should fail if sender doesn’t have enough tokens', async function () {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await chai
        .expect(hardhatToken.connect(addr1).transfer(owner.address, 1))
        .to.be.revertedWith('Not enough tokens');

      // Owner balance shouldn't have changed
      chai
        .expect(await hardhatToken.balanceOf(owner.address))
        .to.equal(initialOwnerBalance);
    });

    it('Should update balances after transfers', async function () {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1
      await hardhatToken.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2
      await hardhatToken.transfer(addr2.address, 50);

      // Check balances
      const finalOwnerBalance = await hardhatToken.balanceOf(owner.address);
      chai.expect(finalOwnerBalance).to.equal(initialOwnerBalance - 150);

      const addr1Balance = await hardhatToken.balanceOf(addr1.address);
      chai.expect(addr1Balance).to.equal(100);

      const addr2Balance = await hardhatToken.balanceOf(addr2.address);
      chai.expect(addr2Balance).to.equal(50);
    });
  });
});
