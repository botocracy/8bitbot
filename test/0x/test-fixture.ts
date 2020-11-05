/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * This file is derived from the 0x Starter Project, available under
 * the Apache 2.0 license. https://github.com/0xProject/0x-starter-project
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
//import {loadFixture, deployContract} from 'ethereum-waffle';
import { MockProvider } from 'ethereum-waffle';
import { Wallet } from 'ethers';
//import BasicToken from '../build-contracts/BasicToken.json';
//import {deployMockContract} from '@ethereum-waffle/mock-contract';

//const mockContract = await deployMockContract(wallet, contractAbi);

describe('0x test waffle fixure', function () {
  /*
  async function fixture([wallet, other], provider) {
    const token = await deployContract(wallet, BasicTokenMock, [
      wallet.address, 1000
    ]);
    return {token, wallet, other};
  }
  */

  it('should assign initial balance', async () => {
    /*
    const {token, wallet} = await loadFixture(fixture);

    chai.expect(await token.balanceOf(wallet.address)).to.equal(1000);
    */
  });

  it('should transfer an amount to destination account', async () => {
    /*
    const {token, other} = await loadFixture(fixture);

    await token.transfer(other.address, 7);

    chai.expect(await token.balanceOf(other.address)).to.equal(7);
    */
  });

  let provider: MockProvider;
  let makerWallet: Wallet;
  let takerWallet: Wallet;

  before(async function () {
    this.timeout(4 * 1000);

    // Account balances in wei
    /*
    const ACCOUNT_1_WEI = 1000000000000000000; // 1 ETH
    const ACCOUNT_2_WEI = 1000000000000000000; // 1 ETH
    */

    provider = new MockProvider(/*{
      ganacheOptions: {
        accounts: [{ balance: ACCOUNT_1_WEI }, { balance: ACCOUNT_2_WEI }],
      },
    }*/);

    [makerWallet, takerWallet] = provider.getWallets();

    await provider.setupENS();
  });

  it('should change ether balance', async function () {
    // Test whether the transaction changes the balance of the account
    await chai
      .expect(
        await takerWallet.sendTransaction({
          to: makerWallet.address,
          value: 200,
        })
      )
      .to.changeEtherBalance(makerWallet, 200);
  });
});
