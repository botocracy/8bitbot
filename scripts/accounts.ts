/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * This file is derived from hardhat-deploy-ts-test, available under the
 * MIT license. https://github.com/wighawag/hardhat-deploy-ts-test
 *
 * SPDX-License-Identifier: Apache-2.0 AND MIT
 * See LICENSE.txt for more information.
 */

import '@nomiclabs/hardhat-ethers';
import * as hardhat from 'hardhat';

export async function main() {
  const accounts = await hardhat.ethers.getSigners();

  const addresses = await Promise.all(accounts.map((acc) => acc.getAddress()));

  console.log('Accounts:', addresses);
}
