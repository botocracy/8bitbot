/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { BigNumber } from '0x.js';
import { Web3Wrapper } from '@0x/web3-wrapper';
import chai from 'chai';
import { default as Web3 } from 'web3';
import {
  GANACHE_NETWORK_ID,
  KOVAN_NETWORK_ID,
  RINKEBY_NETWORK_ID,
  ROPSTEN_NETWORK_ID,
} from '../../src/constants';
import { createProviderEngine } from '../../src/provider-engine';

// Utilities
function getNetworkName(networkId: number): string {
  switch (networkId) {
    case ROPSTEN_NETWORK_ID:
      return 'Ropsten';
    case RINKEBY_NETWORK_ID:
      return 'Rinkeby';
    case KOVAN_NETWORK_ID:
      return 'Kovan';
    case GANACHE_NETWORK_ID:
      return 'Ganache';
  }
  return `Unknown (${networkId})`;
}

describe('0x.js', function () {
  before(async function () {
    this.providerEngine = null;
    this.web3 = null;
    this.web3Wrapper = null;
  });

  after(async function () {
    if (this.providerEngine) {
      this.providerEngine.stop();
    }
  });

  it('should be imported', async function () {
    // If no DOM is available, Hls.js will import an empty object
    chai.expect(BigNumber).to.be.a('function');
  });

  it('should create a provider engine', async function () {
    this.providerEngine = createProviderEngine();

    chai.expect(this.providerEngine).to.be.an('object');

    // Log new blocks
    this.providerEngine.on('block', function (block: any) {
      // TODO: Accept 'block' as function parameter
      console.log('================================');
      console.log(
        'BLOCK CHANGED: ',
        '#' + block.number.toString('hex'),
        '0x' + block.hash.toString('hex')
      );
      console.log('================================');
    });
  });

  it('should start the provider engine', async function () {
    // Start polling for blocks
    await this.providerEngine.start();
  });

  it('should create a Web 3 object and wrapper', async function () {
    this.web3 = new Web3(this.providerEngine);
    this.web3Wrapper = new Web3Wrapper(this.providerEngine);

    chai.expect(this.web3).to.be.a('object');
    chai.expect(this.web3Wrapper).to.be.an('object');
  });

  it('should create an exchange', async function () {
    // TODO
  });

  it('should fetch the network ID', async function () {
    this.networkId = await this.web3Wrapper.getNetworkIdAsync();

    chai.expect(this.networkId).to.be.a('number');

    console.log(`Ethereum network ID: ${this.networkId}`);
    console.log(`Ethereum network: ${getNetworkName(this.networkId)}`);

    // TODO: Check ZEROEX_GENESIS_BLOCK for unsupported network IDs

    // Check that the state of the network hasn't changed in the meantime
    chai.expect(this.networkId).to.equal(this.networkId);
  });

  it('should fetch the node version', async function () {
    // Check for node version changes
    const currentNodeVersion = await this.web3Wrapper.getNodeVersionAsync();

    console.log(`Current node version: ${currentNodeVersion}`);

    // Check that the state of the network hasn't changed in the meantime
    chai.expect(currentNodeVersion).to.equal(currentNodeVersion);
  });

  /*
  it('should create ZeroEx', async function () {
    const zeroEx = new ZeroEx(this.web3Wrapper.getProvider(), {
      networkId: this.networkId,
    });

    // Set global exchange address
    const ZEROEX_EXCHANGE_ADDRESS = this.zeroEx.exchange.getContractAddress();
  });

  it('should determine block height', async function () {
    let blockHeight;

    blockHeight = await this.web3Wrapper.getBlockNumberAsync();

    console.log(`Block height: ${blockHeight}`);
  });

  it('should fetch token registry', async function () {
    // TODO: Fetch token registry
    // See https://github.com/vsergeev/0xtrades.info/blob/master/client/src/model.ts
  });

  it('should subscribe to the exchange', async function () {
    // Initialize contracts
    const contractWrappers = new ContractWrappers(
      this.web3Wrapper.getProvider(),
      {
        networkId: NETWORK_CONFIGS.networkId,
      }
    );

    // No filter, get all of the Fill Events
    const filterValues = {};

    // Subscribe to the Fill Events on the exchange
    contractWrappers.exchange.subscribe(
      ZeroEx.ExchangeEvents.Fill,
      filterValues,
      handleFillOrder
    );
  });
  */
});
