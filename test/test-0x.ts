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
import chai from 'chai';

// Test accounts
// Provide mnemonic here to bypass MetaMask
//const MNEMONIC = 'like ocean fall stock mammal approve woman sausage survey hat remember target auction obey envelope';

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
function getNetworkName(networkId) {
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
  it('should be imported', async function () {
    // If no DOM is available, Hls.js will import an empty object
    chai.expect(BigNumber).to.be.a('function');
  });
});
