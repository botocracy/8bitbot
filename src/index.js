/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

/**
 * Application logic
 **/

import Hls from 'hls.js';
import WebTorrent from 'webtorrent';

import { getRtcConfig } from './utils';

import { IPFS_GATEWAY } from './ipfs';
import { MotionTracker } from './motiontracker';
import { loadVideoInfo } from './peertube-api';
import { VideoPlayer } from './player/video-player';
import { World } from './world';

import {
  assetDataUtils,
  BigNumber,
  generatePseudoRandomSalt,
  signatureUtils,
} from '0x.js';
import { MnemonicWalletSubprovider } from '@0x/subproviders';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractWrappers } from '@0x/contract-wrappers';
import { default as Web3ProviderEngine } from 'web3-provider-engine';
import { default as Web3 } from 'web3';
import { default as RPCSubprovider } from 'web3-provider-engine/subproviders/rpc';

const world = new World();

const VIDEO_ID = '5ea4b933-26e2-4813-a2b2-7c99c8626a60'; // Dubai Creek by Swedrone

// Test accounts
// Provide mnemonic here to bypass MetaMask
const MNEMONIC =
  'like ocean fall stock mammal approve woman sausage survey hat remember target auction obey envelope';

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

// Run the marketplace logic
async function runMarketplace() {
  // TODO: Wait for a Web 3 account
  /*
  if (!(await waitForLogin())) {
    return;
  }
  */

  log_market(`Running marketplace`);

  // Create the exchange
  const web3Wrapper = await createExchange();

  // TODO: Order match callback needs access to web3Wrapper
  window.web3Wrapper = web3Wrapper;

  /*
  botIcon.onclick = async () => {
    await runSellerAction(web3Wrapper);
  };

  parachuteIcon.onclick = async () => {
    // Run the auction
    await runBuyerAction(web3Wrapper);
  };
  */

  // TODO: Close the exchange when we're done with it
  //await closeExchange(web3Wrapper);
}

// Create an 0x exchange
async function createExchange() {
  log_market(`Creating exchange`);

  // Create a Web 3 provider engine
  const providerEngine = new Web3ProviderEngine();
  const web3 = new Web3(providerEngine);

  // Compose our providers, order matters

  // All account based and signing requests will go through the first provider
  providerEngine.addProvider(
    new MnemonicWalletSubprovider({
      mnemonic: MNEMONIC,
    })
  );

  // Use an RPC provider to route all other requests
  providerEngine.addProvider(
    new RPCSubprovider({ rpcUrl: NETWORK_CONFIGS.rpcUrl })
  );

  // Log new blocks
  providerEngine.on('block', function (block) {
    // TODO: Accept 'block' as function parameter
    console.log('================================');
    console.log(
      'BLOCK CHANGED: ',
      '#' + block.number.toString('hex'),
      '0x' + block.hash.toString('hex')
    );
    console.log('================================');
  });

  // TODO: Handle network connectivity error?
  providerEngine.on('error', function (err) {
    // Connectivity errors are reported in the console
  });

  // Start provider engine
  log_market(`Starting Web 3 provider`);
  await providerEngine.start();

  // Create Web 3 wrapper
  log_market(`Creating Web 3 wrapper`);
  const web3Wrapper = new Web3Wrapper(providerEngine);

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

  //await subscribeToExchange(web3Wrapper); // TODO

  return web3Wrapper;
}

//////////////////////////////////////////////////////////////////////////
// Application parameters
//////////////////////////////////////////////////////////////////////////

// TODO
const DATABASE_NAME = '8bitbot';

// Logging prefixes
const LOG_IPFS = 'IPFS  ';
const LOG_UI = 'UI    ';
const LOG_MARKET = 'MARKET';

//////////////////////////////////////////////////////////////////////////
// External libraries
//////////////////////////////////////////////////////////////////////////

// CID for external libraries
const DISTRO_CID = 'QmUATZDVu9A4m9kn2uNDgFafiDpkUKyPWdiunp1zNZ4NFs';

// IPFS libraries
const JS_IPFS_VERSION = '0.47.0';
const ORBIT_DB_VERSION = '0.24.2';

// URIs
const JS_IPFS_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/ipfs_${JS_IPFS_VERSION}/index.min.js`;
const ORBIT_DB_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/orbit-db_${ORBIT_DB_VERSION}/orbitdb.min.js`;

//////////////////////////////////////////////////////////////////////////
// Application info
//////////////////////////////////////////////////////////////////////////

console.log('-------------------------------------');
console.log(`${document.title}`);
console.log(`js-ipfs version: ${JS_IPFS_VERSION}`);
console.log(`OrbitDB version: ${ORBIT_DB_VERSION}`);
console.log(`Gateway: ${IPFS_GATEWAY}`);
console.log(`World version: ${world.version}`);
console.log(`World: ${world.cid}`);
console.log(`Libraries: ${DISTRO_CID}`);
console.log('-------------------------------------');

//////////////////////////////////////////////////////////////////////////
// Application logic
//////////////////////////////////////////////////////////////////////////

// Bootstraps IPFS and transfers control to our entry points
async function bootstrapIpfs() {
  log_ipfs(`Bootstrapping IPFS`);

  log_ipfs(`Downloading IPFS libraries`);
  await Promise.all([loadScript(JS_IPFS_SRC), loadScript(ORBIT_DB_SRC)]);
  log_ipfs(`Finished downloading IPFS libraries`);

  // IPFS options
  const options = {
    repo: `ipfs-${Math.random()}`,
    EXPERIMENTAL: {
      ipnsPubsub: true,
      sharding: true,
    },
  };

  // Create IPFS node
  const node = await Ipfs.create(options);

  // Log node status
  const status = node.isOnline() ? 'online' : 'offline';
  log_ipfs(`IPFS node status: ${status}`);

  //
  // IPFS is ready to use!
  // See https://github.com/ipfs/js-ipfs#core-api
  //

  // Load OrbitDB
  await loadOrbitDB(node);
}

// Publish an object to OrbitDB
async function publishMessage(message) {
  log_ipfs(`Publishing message:`);
  console.log(message);

  // TODO: Fix global dependency
  window.sellOrder = message;

  // TODO
  runBuyerAction(window.web3Wrapper);
}

// Handle an object received by OrbitDB
async function handleMessage(message) {
  // Recover the sell order
  //sellOrder = decodeMessage(message);

  // Expose the sell order to the user
  window.sellOrder = sellOrder;
}

//////////////////////////////////////////////////////////////////////////
// OrbitDB (TODO)
//////////////////////////////////////////////////////////////////////////

async function loadOrbitDB(ipfsNode) {
  // Create the database
  log_ipfs(`Creating OrbitDB database`);
  const orbitdb = await window.OrbitDB.createInstance(ipfsNode);

  log_ipfs(`   DB name: ${DATABASE_NAME}`);
  const db = await orbitdb.log(DATABASE_NAME);

  log_ipfs(`   DB address: ${db.address.toString()}`);

  /* TODO
  dbAddress = db.address.toString();

  db2 = await orbitdb.log(dbAddress);

  db2.events.on('replicated', () => {
    const result = db2.iterator({limit: -1}).collect().map(e => e.payload.value);
    log_ipfs(`Result:`);
    console.log(result);
  });
  */
}

//////////////////////////////////////////////////////////////////////////
// UI logic
//
// TODO: Move to IPFS
//////////////////////////////////////////////////////////////////////////

// Constants
const HLS_BUFFER_LENGTH = 60 * 60; // 1 hour (limit by size, not time)
const HLS_BUFFER_SIZE = 1 * 1024 * 1024 * 1024; // 1 GB

// Entry point after bootstrapping IPFS
async function loadUserInterface(node) {
  // Check HLS video playback
  log_ui(`  HLS support: ${Hls.isSupported()}`);

  // TODO: Add fallback
  if (!Hls.isSupported()) {
    log_ui('HLS support is required');
    return;
  }

  //const videoUri = await world.getVideoHlsUri();

  //await loadHls(videoUri);

  const videoInfo = await loadVideoInfo(VIDEO_ID);

  if (videoInfo) {
    console.log(`Opening video "${videoInfo.name}"`);

    const videoDiv = document.getElementById('videoBackground');

    const player = new VideoPlayer(videoDiv);

    await player.open(videoInfo);

    log_ui(`Video player started in ${player.mode} mode`);

    const videoElement = document.getElementById('vjs_video_3_html5_api');

    // Video will start soon, so show the volume indicator
    var volumeIcon = videoElement.muted
      ? document.getElementById('volumeMuteIcon')
      : document.getElementById('volumeUpIcon');

    volumeIcon.style.display = 'block';

    // Start OpenCV processing
    motionTracker.start(videoElement);
  }
}

async function loadHls(videoUri) {
  const hls = new Hls({
    maxBufferLength: HLS_BUFFER_LENGTH,
    maxBufferSize: HLS_BUFFER_SIZE,
    maxMaxBufferSize: HLS_BUFFER_SIZE,
  });

  hls.loadSource(videoUri);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    log_ui(`Parsed HLS manifest`);

    var video = document.getElementById('videoBackground');
    hls.attachMedia(video);

    // Video will start soon, so show the volume indicator
    var volumeIcon = video.muted
      ? document.getElementById('volumeMuteIcon')
      : document.getElementById('volumeUpIcon');

    volumeIcon.style.display = 'block';

    // Start OpenCV processing
    motionTracker.start(video);
  });
}

const motionTracker = new MotionTracker(window);

//////////////////////////////////////////////////////////////////////////
// Menu logic
//////////////////////////////////////////////////////////////////////////

// TODO

//////////////////////////////////////////////////////////////////////////
// Game logic
//////////////////////////////////////////////////////////////////////////

// TODO

//////////////////////////////////////////////////////////////////////////
// UI logic
//////////////////////////////////////////////////////////////////////////

// Handle volume selection
function onVolumeSelect() {
  const video = document.getElementById('vjs_video_3_html5_api');

  const volumeMuteIcon = document.getElementById('volumeMuteIcon');
  const volumeUpIcon = document.getElementById('volumeUpIcon');

  if (video.muted) {
    // Unmute video
    video.muted = false;

    volumeMuteIcon.style.display = 'none';
    volumeUpIcon.style.display = 'block';
  } else {
    // Mute video
    video.muted = true;

    volumeUpIcon.style.display = 'none';
    volumeMuteIcon.style.display = 'block';
  }
}

// Go full-screen
function enterFullscreen() {
  const canvas = document.getElementById('renderCanvas');

  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  } else if (canvas.webkitRequestFullscreen) {
    canvas.webkitRequestFullscreen();
  } else if (canvas.mozRequestFullScreen) {
    canvas.mozRequestFullScreen();
  } else if (canvas.msRequestFullscreen) {
    canvas.msRequestFullscreen();
  }
}

// Exit full-screen
function leaveFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

// Handle full-screen selection
function onFullscreenSelect() {
  // Are we full-screen?
  const inFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  if (inFullscreen) {
    enterFullscreenIcon.style.display = 'none';
    leaveFullscreenIcon.style.display = 'block';
  } else {
    enterFullscreenIcon.style.display = 'block';
    leaveFullscreenIcon.style.display = 'none';
  }
}

// Check if full-screen is available
function fullscreenAvailable() {
  const fullscreenAvailable =
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled;

  return fullscreenAvailable;
}

// UI state
window.showOverlay = false;

// Toggle overlay
function toggleOverlay() {
  const viewOverlayIcon = document.getElementById('viewOverlayIcon');
  const hideOverlayIcon = document.getElementById('hideOverlayIcon');
  const overlayCanvas2D = document.getElementById('overlayCanvas2D');
  const overlayCanvas3D = document.getElementById('overlayCanvas3D');

  if (window.showOverlay) {
    window.showOverlay = false;
    viewOverlayIcon.style.display = 'block';
    hideOverlayIcon.style.display = 'none';
    overlayCanvas2D.style.display = 'none';
    overlayCanvas3D.style.display = 'none';
  } else {
    window.showOverlay = true;
    viewOverlayIcon.style.display = 'none';
    hideOverlayIcon.style.display = 'block';
    overlayCanvas2D.style.display = 'block';
    overlayCanvas3D.style.display = 'block';
  }
}

//////////////////////////////////////////////////////////////////////////
// Utilities
//////////////////////////////////////////////////////////////////////////

// Load a script asynchronously
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var script;
    script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function getRandomFutureDateInSeconds() {
  return new BigNumber(Date.now() + TEN_MINUTES_MS)
    .div(ONE_SECOND_MS)
    .integerValue(BigNumber.ROUND_CEIL);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log_ipfs(message) {
  console.log(`[IPFS  ] ${message}`);
}

function log_ui(message) {
  console.log(`[UI    ] ${message}`);
}

function log_market(message) {
  console.log(`[MARKET] ${message}`);
}

// Install UI logic
const volumeDownIcon = document.getElementById('volumeDownIcon');
const volumeMuteIcon = document.getElementById('volumeMuteIcon');
const volumeOffIcon = document.getElementById('volumeOffIcon');
const volumeUpIcon = document.getElementById('volumeUpIcon');

volumeDownIcon.onclick = volumeMuteIcon.onclick = volumeOffIcon.onclick = volumeUpIcon.onclick = onVolumeSelect;

if (fullscreenAvailable()) {
  const enterFullscreenIcon = document.getElementById('enterFullscreenIcon');
  const leaveFullscreenIcon = document.getElementById('leaveFullscreenIcon');

  enterFullscreenIcon.onclick = enterFullscreen;
  leaveFullscreenIcon.onclick = leaveFullscreen;

  document.addEventListener('fullscreenchange', onFullscreenSelect);

  // Initialize async
  onFullscreenSelect();
}

const viewOverlayIcon = document.getElementById('viewOverlayIcon');
const hideOverlayIcon = document.getElementById('hideOverlayIcon');

viewOverlayIcon.onclick = hideOverlayIcon.onclick = toggleOverlay;

//////////////////////////////////////////////////////////////////////////
// Async entry points
//////////////////////////////////////////////////////////////////////////

bootstrapIpfs();

// TODO: Move UI to IPFS
loadUserInterface(null);
