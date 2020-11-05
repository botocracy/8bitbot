/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import { NETWORK_CONFIGS } from '../src/web3/configs';
import {
  GANACHE_NETWORK_ID,
  KOVAN_NETWORK_ID,
  RINKEBY_NETWORK_ID,
  ROPSTEN_NETWORK_ID,
} from '../src/web3/constants';

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

describe('web3', function () {
  it('should log the network ID', async function () {
    const networkId = NETWORK_CONFIGS.networkId;

    chai.expect(networkId).to.be.a('number');

    console.log(`Ethereum network ID: ${networkId}`);
    console.log(`Ethereum network: ${getNetworkName(networkId)}`);

    chai.expect(getNetworkName(networkId)).to.equal('Ropsten');
  });
});
