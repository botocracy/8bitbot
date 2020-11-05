/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import {
  assetDataUtils,
  BigNumber,
  generatePseudoRandomSalt,
  signatureUtils,
} from '0x.js';
import {
  Mesh,
  OrderEvent,
  SignedOrder,
  SupportedProvider,
} from '@0x/mesh-browser';
import { MnemonicWalletSubprovider } from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';
import chai from 'chai';
import { ContractWrappers } from '@0x/contract-wrappers';
import { default as Web3ProviderEngine } from 'web3-provider-engine';
import { default as Web3 } from 'web3';
import { default as RPCSubprovider } from 'web3-provider-engine/subproviders/rpc';

// Test accounts
// Provide mnemonic here to bypass MetaMask
const MNEMONIC =
  'like ocean fall stock mammal approve woman sausage survey hat remember target auction obey envelope';

// Constants
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
const TEN_MINUTES_MS = ONE_MINUTE_MS * 10;
const DECIMALS = 18;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const ROPSTEN_NETWORK_ID = 3;
const RINKEBY_NETWORK_ID = 4;
const KOVAN_NETWORK_ID = 42;
const GANACHE_NETWORK_ID = 50;

// Config
const TX_DEFAULTS = {
  gas: 400000,
};
const GANACHE_CONFIGS = {
  rpcUrl: 'http://127.0.0.1:8545',
  networkId: GANACHE_NETWORK_ID,
};
const KOVAN_CONFIGS = {
  rpcUrl: 'https://kovan.infura.io/',
  networkId: KOVAN_NETWORK_ID,
};
const ROPSTEN_CONFIGS = {
  rpcUrl: 'https://ropsten.infura.io/v3/bd1da1ddceef40ec9c0d3101e43b3ae6',
  networkId: ROPSTEN_NETWORK_ID,
};
const RINKEBY_CONFIGS = {
  rpcUrl: 'https://rinkeby.infura.io/',
  networkId: RINKEBY_NETWORK_ID,
};
const NETWORK_CONFIGS = ROPSTEN_CONFIGS; // or KOVAN_CONFIGS or ROPSTEN_CONFIGS or RINKEBY_CONFIGS

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

  it('should create an exchange', async function () {
    // Create a Web 3 provider engine
    this.providerEngine = new Web3ProviderEngine();
    this.web3 = new Web3(this.providerEngine);

    // Compose our providers, order matters

    // All account based and signing requests will go through the first provider
    this.providerEngine.addProvider(
      new MnemonicWalletSubprovider({
        mnemonic: MNEMONIC,
      })
    );

    // Use an RPC provider to route all other requests
    this.providerEngine.addProvider(
      new RPCSubprovider({ rpcUrl: NETWORK_CONFIGS.rpcUrl })
    );

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

    // TODO: Handle network connectivity error?
    this.providerEngine.on('error', function (err: any) {
      // Connectivity errors are reported in the console
    });

    chai.expect(this.providerEngine).to.be.an('object');
    chai.expect(this.web3).to.be.a('object');
  });

  it('should start the exchange', async function () {
    // Start polling for blocks
    await this.providerEngine.start();
  });

  it('should create a Web 3 wrapper', async function () {
    this.web3Wrapper = new Web3Wrapper(this.providerEngine);

    chai.expect(this.web3Wrapper).to.be.an('object');
  });

  it('should fetch the network ID', async function () {
    this.networkId = await this.web3Wrapper.getNetworkIdAsync();

    chai.expect(this.networkId).to.be.a('number');

    console.log(`Ethereum network ID: ${this.networkId}`);
    console.log(`Ethereum network: ${getNetworkName(this.networkId)}`);

    // TODO: Check ZEROEX_GENESIS_BLOCK for unsupported network IDs

    // Check that the state of the network hasn't changed in the meantime
    chai
      .expect(await this.web3Wrapper.getNetworkIdAsync())
      .to.equal(this.networkId);
  });

  it('should fetch the node version', async function () {
    // Check for node version changes
    const currentNodeVersion = await this.web3Wrapper.getNodeVersionAsync();

    console.log(`Current node version: ${currentNodeVersion}`);

    // Check that the state of the network hasn't changed in the meantime
    chai
      .expect(await this.web3Wrapper.getNodeVersionAsync())
      .to.equal(currentNodeVersion);
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
