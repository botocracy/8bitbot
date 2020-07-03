//////////////////////////////////////////////////////////////////////////
// Marketplace logic
//
// TODO: Move to IPFS
//
// TODO: Token tracking (https://github.com/vsergeev/0xtrades.info/blob/master/client/src/model.ts)
//////////////////////////////////////////////////////////////////////////

// Marketplace libraries
const BIG_NUMBER_VERSION = '9.0.0';
const CONTRACT_ADDRESSES_VERSION = '3.0.3';
const SUBPROVIDERS_VERSION = '5.0.1';
const WEB3_WRAPPER_VERSION = '6.0.10';
const ZEROX_JS_VERSION = '6.0.15';

// URIs
const BIG_NUMBER_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/bignumber.js_${BIG_NUMBER_VERSION}/bignumber.min.js`;
const CONTRACT_ADDRESSES_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/contract-addresses_${CONTRACT_ADDRESSES_VERSION}/index.js`;
const SUBPROVIDERS_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/subproviders_${SUBPROVIDERS_VERSION}/index.js`;
const WEB3_WRAPPER_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/web3-wrapper_${WEB3_WRAPPER_VERSION}/index.js`;
const ZEROX_JS_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/0x.js_${ZEROX_JS_VERSION}/index.min.js`;

// Test accounts
// Provide mnemonic here to bypass MetaMask
//const MNEMONIC = 'like ocean fall stock mammal approve woman sausage survey hat remember target auction obey envelope';

// Constants
const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = ONE_SECOND_MS * 60;
const TEN_MINUTES_MS = ONE_MINUTE_MS * 10;
const DECIMALS = 18;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const ROPSTEN_NETWORK_ID = 3;
const RINKEBY_NETWORK_ID = 4;
const KOVAN_NETWORK_ID = 42;
const GANACHE_NETWORK_ID = 50;

// Config
const TX_DEFAULTS = {
  gas: 400000,
};
const GANACHE_CONFIGS = {
  rpcUrl: 'http://127.0.0.1:8545',
  networkId: GANACHE_NETWORK_ID,
};
const KOVAN_CONFIGS = {
  rpcUrl: 'https://kovan.infura.io/',
  networkId: KOVAN_NETWORK_ID,
};
const ROPSTEN_CONFIGS = {
  rpcUrl: 'https://ropsten.infura.io/v3/bd1da1ddceef40ec9c0d3101e43b3ae6',
  networkId: ROPSTEN_NETWORK_ID,
};
const RINKEBY_CONFIGS = {
  rpcUrl: 'https://rinkeby.infura.io/',
  networkId: RINKEBY_NETWORK_ID,
};
const NETWORK_CONFIGS = ROPSTEN_CONFIGS; // or KOVAN_CONFIGS or ROPSTEN_CONFIGS or RINKEBY_CONFIGS

// Utilities
function getNetworkName(networkId) {
  switch (networkId) {
    case ROPSTEN_NETWORK_ID:
      return 'Ropsten';
    case RINKEBY_NETWORK_ID:
      return 'Rinkeby';
    case KOVAN_NETWORK_ID:
      return 'Kovan';
    case GANACHE_NETWORK_ID:
      return 'Ganache';
  }
  return `Unknown (${networkId})`;
}

// Entry point
window.addEventListener('load', async () => {
  // Detect if Web3 is found, if not, ask the user to install MetaMask
  if (typeof web3 === 'undefined') {
    // Show MetaMask install dialog
    log_market(`Web 3 not detected, showing MetaMask install dialog`);

    var dialog = document.getElementById('metamaskDialog');
    var dialogBody = document.getElementById('metamaskDialogForegroundInstall');

    dialog.style.display = 'block';
    dialogBody.style.display = 'block';

    // Require a page refresh
    return;
  } else {
    log_market(`Web 3 support detected`);
  }

  const dialogLogin = document.getElementById('metamaskDialogForegroundLogin');

  // Called on MetaMask login UI interaction
  dialogLogin.onclick = async () => {
    ethereum.enable();
  };

  // Run the marketplace
  runMarketplace();
});

// Load the marketplace
async function loadMarketplace() {
  log_market(`Downloading marketplace`);

  await Promise.all([
    loadScript(ZEROX_JS_SRC),
    loadScript(CONTRACT_ADDRESSES_SRC),
    loadScript(WEB3_WRAPPER_SRC),
    loadScript(BIG_NUMBER_SRC),
    loadScript(SUBPROVIDERS_SRC),
  ]);

  log_market(`Finished downloading marketplace`);
}

// Wait until the user connects with MetaMask
async function waitForLogin() {
  if (typeof web3 === 'undefined' || web3.eth.accounts.length == 0) {
    // Show metamask login dialog
    log_market(`Showing MetaMask login dialog`);

    var dialog = document.getElementById('metamaskDialog');
    var dialogBody = document.getElementById('metamaskDialogForegroundLogin');

    dialog.style.display = 'block';
    dialogBody.style.display = 'block';

    log_market(`Checking for Web 3`);

    if (typeof web3 === 'undefined') {
      log_market(`Web 3 not found`);
      return false;
    }

    // Check the connection
    if (!web3.isConnected()) {
      console.error('Web 3 is not connected');
      return false;
    }

    // Check accounts
    if (web3.eth.accounts.length == 0) {
      ethereum.enable();

      while (web3.eth.accounts.length == 0) {
        log_market(`Waiting 1s for MetaMask connection`);
        await sleep(1000);
      }
    }

    dialog.style.display = 'none';
    dialogBody.style.display = 'none';
  }

  log_market(`Connected to accounts ${web3.eth.accounts}`);

  return true;
}

// Run the marketplace logic
async function runMarketplace() {
  // Load the marketplace
  await loadMarketplace();

  // Wait for a Web 3 account
  if (!(await waitForLogin())) {
    return;
  }

  log_market(`Running marketplace`);

  // Create the exchange
  web3Wrapper = await createExchange();

  // TODO: Order match callback needs access to web3Wrapper
  window.web3Wrapper = web3Wrapper;

  botIcon.onclick = async () => {
    await runSellerAction(web3Wrapper);
  };

  parachuteIcon.onclick = async () => {
    // Run the auction
    await runBuyerAction(web3Wrapper);
  };

  // TODO: Close the exchange when we're done with it
  //await closeExchange(web3Wrapper);
}

// Create an 0x exchange
async function createExchange() {
  log_market(`Creating exchange`);

  // Create Web 3 provider engine
  const providerEngine = new ZeroEx.Web3ProviderEngine();

  // Compose our providers, order matters
  // All account based and signing requests will go through the first provider
  if (typeof MNEMONIC !== 'undefined') {
    providerEngine.addProvider(
      new Subproviders.MnemonicWalletSubprovider({
        mnemonic: MNEMONIC,
      })
    );
  } else if (window.ethereum.isMetaMask) {
    providerEngine.addProvider(
      new Subproviders.MetamaskSubprovider(window.ethereum)
    );
  } else {
    providerEngine.addProvider(
      new Subproviders.SignerSubprovider(window.ethereum)
    );
  }

  // Add RPC provider
  providerEngine.addProvider(new ZeroEx.RPCSubprovider(NETWORK_CONFIGS.rpcUrl));

  // Start provider engine
  log_market(`Starting Web 3 provider`);
  await providerEngine.start();

  // Create Web 3 wrapper
  log_market(`Creating Web 3 wrapper`);
  const web3Wrapper = new Web3Wrapper.Web3Wrapper(providerEngine);

  // Fetch the network ID (TODO)
  var networkId;

  try {
    networkId = await web3Wrapper.getNetworkIdAsync();
  } catch (err) {
    log_market(`Error determining network version:`);
    console.error(err);
  }

  log_market(`   Ethereum network: ${getNetworkName(networkId)}`);

  // TODO: Check ZEROEX_GENESIS_BLOCK for unsupported network IDs

  /*
  zeroEx = new ZeroEx(web3Wrapper.getProvider(), {
    networkId: networkId,
  });
  */

  // Set global exchange address (FIXME read-only override)
  //ZEROEX_EXCHANGE_ADDRESS = zeroEx.exchange.getContractAddress();

  // Determine block height
  var blockHeight;

  try {
    blockHeight = await web3Wrapper.getBlockNumberAsync();
  } catch (err) {
    log_market(`Error determining block height:`);
    console.error(err);
  }

  log_market(`   Block height: ${blockHeight}`);

  // TODO: Fetch token registry
  // See https://github.com/vsergeev/0xtrades.info/blob/master/client/src/model.ts

  await subscribeToExchange(web3Wrapper);

  return web3Wrapper;
}

// Subscribe to the exchange
async function subscribeToExchange(web3Wrapper) {
  log_market(`Subscribing to exchange`);

  // Initialize contracts
  const contractWrappers = new ZeroEx.ContractWrappers(
    web3Wrapper.getProvider(),
    {
      networkId: NETWORK_CONFIGS.networkId,
    }
  );

  // No filter, get all of the Fill Events
  const filterValues = {};

  // Subscribe to the Fill Events on the exchange
  contractWrappers.exchange.subscribe(
    ZeroEx.ExchangeEvents.Fill,
    filterValues,
    handleFillOrder
  );

  // Show the marketplace UI
  // TODO: Move me
  const botIcon = document.getElementById('botIcon');
  const parachuteIcon = document.getElementById('parachuteIcon');

  botIcon.style.display = 'block';
  parachuteIcon.style.display = 'block';
}

// Handle a fill order from an exchange
async function handleFillOrder(err, decodedLogEvent) {
  if (err) {
    log_market(`Error:`);
    console.error(err);
    //providerEngine.stop();
  } else if (decodedLogEvent) {
    const fillLog = decodedLogEvent.log;
    const makerAssetData = ZeroEx.assetDataUtils.decodeERC20AssetData(
      fillLog.args.makerAssetData
    );
    const takerAssetData = ZeroEx.assetDataUtils.decodeERC20AssetData(
      fillLog.args.takerAssetData
    );

    log_market(`New Fill Event`);
    log_market(`   Order hash: ${fillLog.args.orderHash}`);
    log_market(`   Maker address: ${fillLog.args.makerAddress}`);
    log_market(`   Taker address: ${fillLog.args.takerAddress}`);
    log_market(
      `   Maker asset filled amount: ${fillLog.args.makerAssetFilledAmount.toString()}`
    );
    log_market(
      `   Taker asset filled amount: ${fillLog.args.takerAssetFilledAmount.toString()}`
    );
    log_market(`   Maker token address: ${makerAssetData.tokenAddress}`);
    log_market(`   Taker token address: ${takerAssetData.tokenAddress}`);

    // TODO: Is this message for us?
    const makerAddress = fillLog.args.makerAddress;
    if (makerAddress != '0x8f06beb40cac1bbd540770ee32f47b6d91139456') return;

    // TODO: Assume taker address is important?
    const takerAddress = fillLog.args.takerAddress;
    if (takerAddress != '0xe5f862f7811af180990025b6259b02feb0a0b8dc') return;

    // TODO: This is horrible
    if (typeof window.hasFillEvent === 'undefined') {
      window.hasFillEvent = false;
    }
    if (!hasFillEvent) {
      hasFillEvent = true;
      return;
    } else {
      hasFillEvent = false;
    }

    // TODO: Remove global dependency
    web3Wrapper = window.web3Wrapper;

    while (true) {
      if (await runSellerAction(web3Wrapper)) break;
    }
  }
}

// Run the Dutch auction for the seller
async function runSellerAction(web3Wrapper) {
  log_market(`Running action for seller`);
  const web3Addresses = await web3Wrapper.getAvailableAddressesAsync();
  const sellMaker = web3Addresses[0];
  log_market(`   Sell maker: ${sellMaker}`);

  // Query contract addresses
  const contractAddresses = ContractAddresses.getContractAddressesForNetworkOrThrow(
    NETWORK_CONFIGS.networkId
  );
  const zrxTokenAddress = contractAddresses.zrxToken;
  const etherTokenAddress = contractAddresses.etherToken;

  // Initialize contracts
  const contractWrappers = new ZeroEx.ContractWrappers(
    web3Wrapper.getProvider(),
    {
      networkId: NETWORK_CONFIGS.networkId,
    }
  );

  // Approve the 0x ERC20 Proxy to move ZRX on behalf of sellMaker
  log_market(`Authorizing ERC20 proxy contract...`);
  var sellMakerZRXApprovalTxHash;
  try {
    sellMakerZRXApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
      zrxTokenAddress,
      sellMaker
    );
  } catch (err) {
    log_market(`Authorization error:`);
    console.error(err);
    return false;
  }

  log_market(`   Sell maker ZRX approval: ${sellMakerZRXApprovalTxHash}`);

  // The amount the maker is selling of maker asset
  const makerAssetAmount = Web3Wrapper.Web3Wrapper.toBaseUnitAmount(
    new BigNumber(1),
    DECIMALS
  );

  // The initial opening price of the auction
  const auctionBeginAmount = Web3Wrapper.Web3Wrapper.toBaseUnitAmount(
    new BigNumber(1),
    DECIMALS
  );

  // The final amount at the end of the auction
  const auctionEndAmount = Web3Wrapper.Web3Wrapper.toBaseUnitAmount(
    new BigNumber(0.001),
    DECIMALS
  );

  // 0x v2 uses hex encoded asset data strings to encode all the information needed to identify an asset
  const makerAssetData = ZeroEx.assetDataUtils.encodeERC20AssetData(
    zrxTokenAddress
  );
  const takerAssetData = ZeroEx.assetDataUtils.encodeERC20AssetData(
    etherTokenAddress
  );

  // Begin the auction ten minutes ago (TODO)
  const auctionBeginTimeSeconds = new BigNumber(Date.now() - TEN_MINUTES_MS)
    .div(ONE_SECOND_MS)
    .integerValue(BigNumber.ROUND_CEIL);

  // Encode the asset data
  const dutchAuctionEncodedAssetData = ZeroEx.DutchAuctionWrapper.encodeDutchAuctionAssetData(
    makerAssetData,
    auctionBeginTimeSeconds,
    auctionBeginAmount
  );

  // Set up the Order and fill it
  const randomExpiration = getRandomFutureDateInSeconds();
  const exchangeAddress = contractAddresses.exchange;

  // Create the order
  const sellOrder = {
    exchangeAddress: exchangeAddress,
    makerAddress: sellMaker,
    // taker address is specified to ensure ONLY the dutch auction contract
    // can fill this order (ensuring the price given the block time)
    takerAddress: contractWrappers.dutchAuction.address,
    senderAddress: NULL_ADDRESS,
    feeRecipientAddress: NULL_ADDRESS,
    expirationTimeSeconds: randomExpiration,
    salt: ZeroEx.generatePseudoRandomSalt(),
    makerAssetAmount: makerAssetAmount,
    // taker asset amount is the auction end price. The Dutch Auction
    // contract ensures this is filled at the correct amount
    takerAssetAmount: auctionEndAmount,
    // maker asset data is encoded with additional data used by
    // the Dutch Auction contract
    makerAssetData: dutchAuctionEncodedAssetData,
    takerAssetData: takerAssetData,
    makerFee: BigNumber(0),
    takerFee: BigNumber(0),
  };
  const sellOrderHashHex = ZeroEx.orderHashUtils.getOrderHashHex(sellOrder);

  log_market(`   Sell order: ${sellOrderHashHex}`);

  // Sign the order hash
  log_market(`Signing sell order...`);
  const sellOrderSignature = await ZeroEx.signatureUtils.ecSignHashAsync(
    web3Wrapper.getProvider(),
    sellOrderHashHex,
    sellMaker
  );
  log_market(`   Sell order signature: ${sellOrderSignature}`);

  var sellSignedOrder = sellOrder;
  sellSignedOrder.signature = sellOrderSignature;

  log_market(`Sell order complete`);

  // Publish to OrbitDB
  publishMessage(sellSignedOrder);

  return true;
}

// Run the Dutch auction for the buyer
async function runBuyerAction(web3Wrapper) {
  // TODO
  if (typeof window.sellOrder === 'undefined') {
    alert('Create sell order first');
    return;
  }

  log_market(`Running action for buyer`);

  const web3Addresses = await web3Wrapper.getAvailableAddressesAsync();
  const buyMaker = web3Addresses[0];
  log_market(`   Buy maker: ${buyMaker}`);

  // Query contract addresses
  const contractAddresses = ContractAddresses.getContractAddressesForNetworkOrThrow(
    NETWORK_CONFIGS.networkId
  );
  const zrxTokenAddress = contractAddresses.zrxToken;
  const etherTokenAddress = contractAddresses.etherToken;

  // Initialize contracts
  const contractWrappers = new ZeroEx.ContractWrappers(
    web3Wrapper.getProvider(),
    {
      networkId: NETWORK_CONFIGS.networkId,
    }
  );

  // Approve the 0x ERC20 Proxy to move WETH on behalf of buyMaker
  log_market(`Authorizing ERC20 proxy contract...`);
  const buyMakerWETHApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
    etherTokenAddress,
    buyMaker
  );
  log_market(`   Buy maker WETH approval: ${buyMakerWETHApprovalTxHash}`);

  // TODO
  sellOrder = window.sellOrder;

  // Create the buy order
  const auctionDetails = await contractWrappers.dutchAuction.getAuctionDetailsAsync(
    sellOrder
  );
  const currentAuctionAmount = auctionDetails.currentAmount;
  log_market(`   Current auction amount: ${currentAuctionAmount}`);

  // Convert ETH into WETH for taker by depositing ETH into the WETH contract
  log_market(`Depositing current price (${currentAuctionAmount})...`);
  const buyMakerWETHDepositTxHash = await contractWrappers.etherToken.depositAsync(
    etherTokenAddress,
    currentAuctionAmount,
    buyMaker
  );
  log_market(`   Buy maker WETH deposit: ${buyMakerWETHDepositTxHash}`);

  // The buyer creates a matching order, specifying the current auction amount
  var buyOrder = {
    exchangeAddress: sellOrder.exchangeAddress,
    makerAddress: buyMaker,
    takerAddress: contractWrappers.dutchAuction.address,
    senderAddress: NULL_ADDRESS,

    feeRecipientAddress: NULL_ADDRESS,
    expirationTimeSeconds: sellOrder.expirationTimeSeconds,
    salt: ZeroEx.generatePseudoRandomSalt(),
    makerAssetAmount: currentAuctionAmount,
    takerAssetAmount: sellOrder.makerAssetAmount,
    makerAssetData: sellOrder.takerAssetData,
    takerAssetData: sellOrder.makerAssetData,
    makerFee: new BigNumber(0),
    takerFee: new BigNumber(0),
  };
  const buyOrderHashHex = ZeroEx.orderHashUtils.getOrderHashHex(buyOrder);

  log_market(`   Buy order: ${buyOrderHashHex}`);

  // Sign the order hash
  log_market(`Signing buy order...`);
  const buyOrderSignature = await ZeroEx.signatureUtils.ecSignHashAsync(
    web3Wrapper.getProvider(),
    buyOrderHashHex,
    buyMaker
  );
  log_market(`   Buy order signature: ${buyOrderSignature}`);

  var buySignedOrder = buyOrder;
  buyOrder.signature = buyOrderSignature;

  // Match the orders
  log_market(`Matching orders...`);
  txHash = await contractWrappers.dutchAuction.matchOrdersAsync(
    buySignedOrder,
    sellOrder,
    buyMaker,
    {
      gasLimit: TX_DEFAULTS.gas,
    }
  );
  log_market(`   Transaction hash: ${txHash}`);

  // Wait for transaction to be mined
  log_market(`Waiting for transaction to be mined...`);
  var start = performance.now();
  var txReceipt;
  try {
    txReceipt = await web3Wrapper.awaitTransactionMinedAsync(txHash);
  } catch (err) {
    console.log(`Transaction failed: ${err.message}`);
  }
  var end = performance.now();
  log_market(`   Waited for ${(end - start) / 1000.0} seconds`);

  // Success!
  log_market(`Transaction complete`);
  log_market(
    `   Transaction status: ${txReceipt.status === 1 ? 'Success' : 'Failure'}`
  );
  log_market(`   Gas used: ${txReceipt.gasUsed}`);
}

// Close the exchange
async function closeExchange(web3Wrapper) {
  // TODO: Stop the Provider Engine
  //web3Wrapper.getProvider().stop();
}
