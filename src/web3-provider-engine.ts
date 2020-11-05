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
  GanacheSubprovider,
  MnemonicWalletSubprovider,
} from '@0x/subproviders';
import { default as Web3ProviderEngine } from 'web3-provider-engine';
import { default as RPCSubprovider } from 'web3-provider-engine/subproviders/rpc';
import {
  BASE_DERIVATION_PATH,
  GANACHE_CONFIGS,
  NETWORK_CONFIGS,
} from './configs';
import { MNEMONIC } from './environment';

export const mnemonicWallet = new MnemonicWalletSubprovider({
  mnemonic: MNEMONIC,
  baseDerivationPath: BASE_DERIVATION_PATH,
});

// Compose our providers, order matters
export const createProviderEngine = (): Web3ProviderEngine => {
  // All account based and signing requests will go through the first provider
  const pe = new Web3ProviderEngine();
  pe.addProvider(mnemonicWallet);

  // Determine provider to route all other requests
  if (NETWORK_CONFIGS === GANACHE_CONFIGS) {
    pe.addProvider(
      new GanacheSubprovider({
        vmErrorsOnRPCResponse: false,
        network_id: GANACHE_CONFIGS.networkId,
        mnemonic: MNEMONIC,
      })
    );
  } else {
    pe.addProvider(new RPCSubprovider({ rpcUrl: NETWORK_CONFIGS.rpcUrl }));
  }

  return pe;
};
