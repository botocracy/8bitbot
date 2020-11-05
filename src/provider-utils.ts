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

export const providerUtils = {
  /**
   * Starts the Web3ProviderEngine without excess block polling
   * @param providerEngine The Web3ProviderEngine
   */
  startProviderEngine(providerEngine: any): void {
    if (providerEngine.start === undefined) {
      throw new Error(`Invalid Web3ProviderEngine`);
    }

    // HACK: When calling start() Web3ProviderEngine starts a block polling service
    // this continuously pulls data from the network and can result in high data usage
    // for long running services. If used in a front end application this can cause
    // a high amount of load on a node (one request per user per block).
    providerEngine._ready.go();
    providerEngine._running = true;
  },
};
