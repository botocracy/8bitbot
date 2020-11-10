/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import { deployContract, MockProvider, solidity } from 'ethereum-waffle';
import { Contract, Wallet } from 'ethers';
import BasicToken from '../build-contracts/BasicToken.json';

chai.use(solidity);

describe('BasicToken', function () {
  let wallet: Wallet;
  let walletTo: Wallet;
  let token: Contract;

  before(async function () {
    this.timeout(3 * 1000);

    [wallet, walletTo] = new MockProvider().getWallets();
  });

  beforeEach(async function () {
    this.timeout(3 * 1000);

    token = await deployContract(wallet, BasicToken, [1000]);
  });

  it('Assigns initial balance', async function () {
    chai.expect(await token.balanceOf(wallet.address)).to.equal(1000);
  });

  it('Transfer adds amount to destination accounts', async function () {
    await token.transfer(walletTo.address, 7);

    chai.expect(await token.balanceOf(walletTo.address)).to.equal(7);
  });

  it('Transfer emits event', async function () {
    await chai
      .expect(token.transfer(walletTo.address, 7))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, walletTo.address, 7);
  });

  it('Can not transfer above the amount', async function () {
    await chai.expect(token.transfer(walletTo.address, 1007)).to.be.reverted;
  });

  it('Can not transfer from empty account', async function () {
    const tokenFromOtherWallet = token.connect(walletTo);

    await chai.expect(tokenFromOtherWallet.transfer(wallet.address, 1)).to.be
      .reverted;
  });

  it('Calls totalSupply on BasicToken contract', async function () {
    await token.totalSupply();

    chai.expect('totalSupply').to.be.calledOnContract(token);
  });

  it('Calls balanceOf with sender address on BasicToken contract', async function () {
    await token.balanceOf(wallet.address);

    chai
      .expect('balanceOf')
      .to.be.calledOnContractWith(token, [wallet.address]);
  });
});
