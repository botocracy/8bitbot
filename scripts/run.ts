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

import * as hardhat from 'hardhat';
import { main } from './accounts';

// Reference hardhat to prevent prettier from removing its import above
hardhat;

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
