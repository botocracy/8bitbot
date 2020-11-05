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
  ContractWrappers,
  ERC20TokenContract,
  OrderStatus,
} from '@0x/contract-wrappers';
import {
  generatePseudoRandomSalt,
  Order,
  signatureUtils,
  SignedOrder,
} from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import chai from 'chai';
import { default as Web3ProviderEngine } from 'web3-provider-engine';
import { NETWORK_CONFIGS, TX_DEFAULTS } from '../../src/configs';
import {
  DECIMALS,
  NULL_ADDRESS,
  NULL_BYTES,
  ONE_SECOND_MS,
  TEN_MINUTES_MS,
  //UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
  ZERO,
} from '../../src/constants';
import { createProviderEngine } from '../../src/provider-engine';

/**
 * Returns an amount of seconds that is greater than the amount of seconds
 * since epoch.
 */
const getRandomFutureDateInSeconds = (): BigNumber => {
  return new BigNumber(Date.now() + TEN_MINUTES_MS)
    .div(ONE_SECOND_MS)
    .integerValue(BigNumber.ROUND_CEIL);
};

const calculateProtocolFee = (
  orders: SignedOrder[],
  gasPrice: BigNumber | number = TX_DEFAULTS.gasPrice
): BigNumber => {
  return new BigNumber(150000).times(gasPrice).times(orders.length);
};

/**
 * In this scenario, the maker creates and signs an order for selling ZRX for
 * WETH. The taker takes this order and fills it via the 0x Exchange contract.
 */
describe('0x fill ERC-20 order', function () {
  let providerEngine: Web3ProviderEngine;
  let contractWrappers: ContractWrappers;
  let web3Wrapper: Web3Wrapper;

  let zrxTokenAddress: string;
  let etherTokenAddress: string;

  let maker: string;
  let taker: string;

  let makerZRXApprovalTxHash: string;
  let takerWETHApprovalTxHash: string;
  let takerWETHDepositTxHash: string;

  let order: Order;
  let signedOrder: SignedOrder;

  // The amount the maker is selling of maker asset
  const makerAssetAmount: BigNumber = Web3Wrapper.toBaseUnitAmount(
    new BigNumber(5),
    DECIMALS
  );

  // The amount the maker wants of taker asset
  const takerAssetAmount: BigNumber = Web3Wrapper.toBaseUnitAmount(
    new BigNumber(0.1),
    DECIMALS
  );

  after(async function () {
    if (providerEngine) {
      // Stop the Provider Engine
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

  it('should initialize the ContractWrappers', async function () {
    this.timeout(3 * 1000);

    // Initialize the ContractWrappers, this provides helper functions around
    // calling 0x contracts as well as ERC20/ERC721 token contracts on the
    // blockchain
    contractWrappers = new ContractWrappers(providerEngine, {
      chainId: NETWORK_CONFIGS.chainId,
    });

    zrxTokenAddress = contractWrappers.contractAddresses.zrxToken;
    etherTokenAddress = contractWrappers.contractAddresses.etherToken;

    // Print addresses
    console.log(`ZRX token address: ${zrxTokenAddress}`);
    console.log(`ETH token address: ${etherTokenAddress}`);
  });

  it('should initialize the Web3Wrapper', async function () {
    // Initialize the Web3Wrapper, this provides helper functions around fetching
    // account information, balances, general contract logs
    web3Wrapper = new Web3Wrapper(providerEngine);
  });

  it('should print accounts', async function () {
    [maker, taker] = await web3Wrapper.getAvailableAddressesAsync();

    // Print accounts
    console.log(`Maker: ${maker}`);
    console.log(`Taker: ${taker}`);
  });

  it('should allow 0x ERC-20 proxy to move ZRX on behalf of maker', async function () {
    // Allow the 0x ERC-20 Proxy to move ZRX on behalf of makerAccount
    const erc20Token = new ERC20TokenContract(zrxTokenAddress, providerEngine);

    /*
    makerZRXApprovalTxHash = await erc20Token
      .approve(
        contractWrappers.contractAddresses.erc20Proxy,
        UNLIMITED_ALLOWANCE_IN_BASE_UNITS
      )
      .sendTransactionAsync({ from: maker });
    */

    /*
    await printUtils.awaitTransactionMinedSpinnerAsync(
      'Maker ZRX Approval',
      makerZRXApprovalTxHash
    );
    */
  });

  it('should allow 0x ERC-20 proxy to move WETH on behalf of taker', async function () {
    // Allow the 0x ERC-20 Proxy to move WETH on behalf of takerAccount
    const etherToken = contractWrappers.weth9;

    /*
    takerWETHApprovalTxHash = await etherToken
      .approve(
        contractWrappers.contractAddresses.erc20Proxy,
        UNLIMITED_ALLOWANCE_IN_BASE_UNITS
      )
      .sendTransactionAsync({ from: taker });
    */

    /*
    await printUtils.awaitTransactionMinedSpinnerAsync(
      'Taker WETH Approval',
      takerWETHApprovalTxHash
    );
    */
  });

  it('should convert ETH into WETH for taker', async function () {
    // Convert ETH into WETH for taker by depositing ETH into the WETH contract
    const etherToken = contractWrappers.weth9;

    /*
    takerWETHDepositTxHash = await etherToken.deposit().sendTransactionAsync({
      from: taker,
      value: takerAssetAmount,
    });
    */

    /*
    await printUtils.awaitTransactionMinedSpinnerAsync(
      'Taker WETH Deposit',
      takerWETHDepositTxHash
    );
    */
  });

  it('should log the setup', async function () {
    console.log('Setup:', [
      ['Maker ZRX Approval', makerZRXApprovalTxHash],
      ['Taker WETH Approval', takerWETHApprovalTxHash],
      ['Taker WETH Deposit', takerWETHDepositTxHash],
    ]);
  });

  it('should set up the order', async function () {
    // 0x v2 uses hex encoded asset data strings to encode all the information
    // needed to identify an asset
    const makerAssetData = await contractWrappers.devUtils
      .encodeERC20AssetData(zrxTokenAddress)
      .callAsync();
    const takerAssetData = await contractWrappers.devUtils
      .encodeERC20AssetData(etherTokenAddress)
      .callAsync();

    const randomExpiration = getRandomFutureDateInSeconds();
    const exchangeAddress = contractWrappers.contractAddresses.exchange;

    // Create the order
    order = {
      chainId: NETWORK_CONFIGS.chainId,
      exchangeAddress,
      makerAddress: maker,
      takerAddress: NULL_ADDRESS,
      senderAddress: NULL_ADDRESS,
      feeRecipientAddress: NULL_ADDRESS,
      expirationTimeSeconds: randomExpiration,
      salt: generatePseudoRandomSalt(),
      makerAssetAmount,
      takerAssetAmount,
      makerAssetData,
      takerAssetData,
      makerFeeAssetData: NULL_BYTES,
      takerFeeAssetData: NULL_BYTES,
      makerFee: ZERO,
      takerFee: ZERO,
    };

    //printUtils.printOrder(order);
    //console.log('Order:', order);

    // Print out the Balances and Allowances
    //await printUtils.fetchAndPrintContractAllowancesAsync();
    //await printUtils.fetchAndPrintContractBalancesAsync();
  });

  it('should generate the order hash and sign it', async function () {
    // Generate the order hash and sign it
    signedOrder = await signatureUtils.ecSignOrderAsync(
      providerEngine,
      order,
      maker
    );

    // Get the order status
    const [
      { orderStatus, orderHash },
      remainingFillableAmount,
      isValidSignature,
    ] = await contractWrappers.devUtils
      .getOrderRelevantState(signedOrder, signedOrder.signature)
      .callAsync();

    // Check if the order is fillable
    if (
      orderStatus === OrderStatus.Fillable &&
      remainingFillableAmount.isGreaterThan(0) &&
      isValidSignature
    ) {
      // Order is fillable
    }
  });

  it('should fill the order via 0x exchange contract', async function () {
    let txHash: string;
    let txReceipt: any; // TODO: better type

    // Fill the Order via 0x Exchange contract
    /*
    txHash = await contractWrappers.exchange
      .fillOrder(signedOrder, takerAssetAmount, signedOrder.signature)
      .sendTransactionAsync({
        from: taker,
        ...TX_DEFAULTS,
        value: calculateProtocolFee([signedOrder]),
      });
    */

    /*
    txReceipt = await printUtils.awaitTransactionMinedSpinnerAsync(
      'fillOrder',
      txHash
    );
    */
    //printUtils.printTransaction('fillOrder', txReceipt, [['orderHash', orderHash]]);

    // Print the Balances
    //await printUtils.fetchAndPrintContractBalancesAsync();
  });
});
