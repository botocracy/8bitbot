/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import 'dotenv-defaults/config';

/**
 * Your API key for Etherscan. Obtain one at https://etherscan.io/
 */
export const ETHERSCAN_API_KEY =
  typeof process === 'object' && process.env
    ? process.env.ETHERSCAN_API_KEY
    : '';

/**
 * Your API key for Infura. Obtain one at https://infura.io/
 */
export const INFURA_API_KEY =
  typeof process === 'object' && process.env ? process.env.INFURA_API_KEY : '';

/**
 * Wallet mnemonic
 */
export const MNEMONIC =
  typeof process === 'object' && process.env
    ? process.env.MNEMONIC
    : 'airport shallow field coral soldier destroy gesture arctic force wrong degree repair';

/**
 * Defaults to a well known private key
 */
export const RINKEBY_PRIVATE_KEY =
  typeof process === 'object' && process.env
    ? process.env.RINKEBY_PRIVATE_KEY
    : '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
