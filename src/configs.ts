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

import {
  GANACHE_NETWORK_ID,
  KOVAN_NETWORK_ID,
  RINKEBY_NETWORK_ID,
  ROPSTEN_NETWORK_ID,
} from './constants';
import { NetworkSpecificConfigs } from './types';

export const TX_DEFAULTS = { gas: 800000, gasPrice: 1000000000 };
export const MNEMONIC =
  'like ocean fall stock mammal approve woman sausage survey hat remember target auction obey envelope';
export const BASE_DERIVATION_PATH = `44'/60'/0'/0`;
export const GANACHE_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'http://127.0.0.1:8545',
  networkId: GANACHE_NETWORK_ID,
  chainId: 1337,
};
export const KOVAN_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'https://kovan.infura.io/',
  networkId: KOVAN_NETWORK_ID,
  chainId: KOVAN_NETWORK_ID,
};
export const ROPSTEN_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'https://ropsten.infura.io/v3/bd1da1ddceef40ec9c0d3101e43b3ae6',
  networkId: ROPSTEN_NETWORK_ID,
  chainId: ROPSTEN_NETWORK_ID,
};
export const RINKEBY_CONFIGS: NetworkSpecificConfigs = {
  rpcUrl: 'https://rinkeby.infura.io/',
  networkId: RINKEBY_NETWORK_ID,
  chainId: RINKEBY_NETWORK_ID,
};
export const NETWORK_CONFIGS = ROPSTEN_CONFIGS; // TODO: Change to mainnet
