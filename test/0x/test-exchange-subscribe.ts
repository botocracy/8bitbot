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

import { ContractWrappers, IndexedFilterValues } from '@0x/contract-wrappers';
import { Web3ProviderEngine } from '@0x/subproviders';
import chai from 'chai';
import { NETWORK_CONFIGS } from '../../src/configs';
import { createProviderEngine } from '../../src/provider-engine';

/**
 * In this scenario, we will subscribe to the Exchange events, listening for
 * Fills. This will create a process to listen to the events, execute another
 * scenario such as fill_order to see the logs printed out.
 */
describe('0x subscribe to exchange', function () {
  let providerEngine: Web3ProviderEngine;

  after(async function () {
    if (providerEngine) {
      providerEngine.stop();
    }
  });

  it('should be imported', async function () {
    chai.expect(ContractWrappers).to.be.a('function');
  });

  // TODO: runMigrationsOnceIfRequiredAsync()?

  it('should create provider engine', async function () {
    providerEngine = createProviderEngine();
  });

  it('should start the provider engine', async function () {
    // Start polling for blocks
    await providerEngine.start(); // TODO: await?
  });

  it('should subscribe to exchange events', function (done) {
    this.timeout(60 * 1000);

    // Initialize the ContractWrappers, this provides helper functions around
    // calling 0x contracts as well as ERC20/ERC721 token contracts on the
    // blockchain
    const contractWrappers = new ContractWrappers(providerEngine, {
      chainId: NETWORK_CONFIGS.chainId,
    });

    // No filter, get all of the Fill Events
    const filterValues: IndexedFilterValues = {};

    /*
    // Subscribe to the Fill Events on the Exchange
    contractWrappers.exchange.subscribe(
      ExchangeEvents.Fill,
      filterValues,
      (
        err: null | Error,
        decodedLogEvent?: DecodedLogEvent<ExchangeFillEventArgs>
      ) => {
        if (err) {
          console.log('error:', err);
        } else if (decodedLogEvent) {
          const fillLog = decodedLogEvent.log;

          const makerAssetData = assetDataUtils.decodeERC20AssetData(
            fillLog.args.makerAssetData
          );
          const takerAssetData = assetDataUtils.decodeERC20AssetData(
            fillLog.args.takerAssetData
          );

          console.log('Fill Event', [
            ['orderHash', fillLog.args.orderHash],
            ['makerAddress', fillLog.args.makerAddress],
            ['takerAddress', fillLog.args.takerAddress],
            [
              'makerAssetFilledAmount',
              fillLog.args.makerAssetFilledAmount.toString(),
            ],
            [
              'takerAssetFilledAmount',
              fillLog.args.takerAssetFilledAmount.toString(),
            ],
            ['makerFeePaid', fillLog.args.makerFeePaid.toString()],
            ['takerFeePaid', fillLog.args.takerFeePaid.toString()],
            ['makerTokenAddress', makerAssetData.tokenAddress],
            ['takerTokenAddress', takerAssetData.tokenAddress],
          ]);
        }

        done();
      }
    );
    */
    done();
  });
});
