/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import * as Web3 from 'web3';
import { OpenSeaPort, Network } from 'opensea-js';

// This example provider won't let you make transactions, only read-only calls:
const WEB3_PROVIDER = 'https://mainnet.infura.io';

describe('OpenSea', function () {
  it('should be imported', async function () {
    chai.expect(OpenSeaPort).to.be.a('function');
  });

  it('should create a web3 provider', async function () {
    this.provider = new Web3.providers.HttpProvider(WEB3_PROVIDER);

    chai.expect(this.provider).to.be.an('object');
  });

  it('should create a seaport', async function () {
    chai.expect(this.provider).to.be.an('object');

    this.seaport = new OpenSeaPort(this.provider, {
      networkName: Network.Main,
    });

    chai.expect(this.seaport).to.be.an('object');
  });
});
