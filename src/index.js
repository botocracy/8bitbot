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
import { World } from './world';
import { isConstructorDeclaration, setTokenSourceMapRange } from 'typescript';

const world = new World();

PEERTUBE_INSTANCE = 'https://diode.zone';

const VIDEO_ID = '5ea4b933-26e2-4813-a2b2-7c99c8626a60' // Dubai Creek by Swedrone

const mode = 'p2p-media-loader' // Or 'webtorrent'

function getVideoUrl(videoId) {
  return `${PEERTUBE_INSTANCE}/api/v1/videos/${videoId}`;
}

function getPreviewUrl(videoId) {
  return `${PEERTUBE_INSTANCE}/static/previews/${videoId}.jpg`;
}

function loadVideoInfo(videoId) {
  return fetch(getVideoUrl(videoId));
}

const videoPromise = loadVideoInfo(VIDEO_ID);
const videoResponse = await videoPromise;

if (!videoResponse.ok) {
  console.error(`Failed to fetch ${getVideoUrl(VIDEO_ID)}`);
} else {
  const videoInfo = await videoResponse.json()

  // TODO: Load preview URL
  console.log(`Preview URL: ${getPreviewUrl(videoId)}`);

  webtorrentVideoFiles = videoInfo.files;

  if (mode === 'p2p-media-loader') {
    //const hlsPlaylist = videoInfo.streamingPlaylists.find(p => p.type === VideoStreamingPlaylistType.HLS);
  }

  if (mode === 'webTorrent') {
    // Import 'webtorrent-plugin'
    const webtorrent = new WebTorrent({
      tracker: {
        rtcConfig: getRtcConfig()
      },
      dht: true,
    })
  }
  else if (mode === 'p2p-media-loader') {
    // Import p2p-media-loader-hlsjs and p2p-media-loader-plugin
  }
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

  const videoUri = await world.getVideoHlsUri();

  await loadHls(videoUri);
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
  const video = document.getElementById('videoBackground');

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
