/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { MockProvider } from '@ethereum-waffle/provider';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { utils, Wallet } from 'ethers';

chai.use(chaiAsPromised);

const { namehash } = utils;

describe('Deploy Ens', function () {
  let provider: MockProvider;
  let wallet: Wallet;

  before(async function () {
    this.timeout(4 * 1000);

    provider = new MockProvider();
    wallet = provider.getWallets()[0];

    await provider.setupENS();
  });

  it('Create domain recursive', async function () {
    this.timeout(3 * 1000);

    const node = namehash('ethworks.tld');

    await provider.ens.createSubDomain('ethworks.tld', {
      recursive: true,
    });

    expect(await provider.ens.ens.owner(node)).to.eq(
      provider.ens.registrars['ethworks.tld'].address
    );
    expect(await provider.ens.ens.resolver(node)).to.eq(
      provider.ens.resolver.address
    );
  });

  it('Set address', async function () {
    this.timeout(3 * 1000);

    await provider.ens.setAddress('vlad.ethworks.tld', wallet.address);

    expect(await provider.resolveName('vlad.ethworks.tld')).to.eq(
      wallet.address
    );
  });

  it('Set address with reverse ', async function () {
    this.timeout(3 * 1000);

    await provider.ens.setAddressWithReverse('vlad.ethworks.test', wallet, {
      recursive: true,
    });
    expect(await provider.lookupAddress(wallet.address)).to.eq(
      'vlad.ethworks.test'
    );
  });
});
