/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import * as hardhat from 'hardhat';
import 'hardhat-deploy';

describe('Deployment', function () {
  beforeEach(async function () {
    this.timeout(4 * 2000);

    await hardhat.deployments.fixture();
  });

  after(async function () {
    this.timeout(4 * 2000);

    await hardhat.deployments.fixture();
  });

  it('should deploy Token', async function () {
    const Token = await hardhat.deployments.get(
      'contracts/src/Token.sol:Token'
    );
    console.log(`Token address: ${Token.address}`);
  });
});
