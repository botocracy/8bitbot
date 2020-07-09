/**
 * Application logic
 **/

import Hls from 'hls.js';

//////////////////////////////////////////////////////////////////////////
// Application parameters
//////////////////////////////////////////////////////////////////////////

// World semver is defined here. Bump this when world changes.
// Major - incompatible with existing APIs
// Minor - backwards-compatible features and functionality
// Patch - backwards-compatible fixes
const WORLD_VERSION = '1.0.0';

// World Content Identifier
const WORLD_CID = 'QmUHi5kmNvVanFJh3EapKHXiDHy8VSi9AatUs6UDkH8odD';

// IPFS parameters
const IPFS_GATEWAYS = [
  'https://ipfs.infura.io',
  'https://gateway.ipfs.io',
  'https://ipfs.io',
];

// TODO
//const IPFS_GATEWAY = IPFS_GATEWAYS[Math.floor(Math.random() * IPFS_GATEWAYS.length)];
const IPFS_GATEWAY = IPFS_GATEWAYS[0];

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

// UI libraries
const JSONLD_VERSION = '1.6.2';

// URIs
const JS_IPFS_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/ipfs_${JS_IPFS_VERSION}/index.min.js`;
const ORBIT_DB_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/orbit-db_${ORBIT_DB_VERSION}/orbitdb.min.js`;
const JSONLD_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/jsonld_${JSONLD_VERSION}/jsonld.min.js`;

//////////////////////////////////////////////////////////////////////////
// Application info
//////////////////////////////////////////////////////////////////////////

console.log('-------------------------------------');
console.log(`${document.title}`);
console.log(`js-ipfs version: ${JS_IPFS_VERSION}`);
console.log(`OrbitDB version: ${ORBIT_DB_VERSION}`);
console.log(`Gateway: ${IPFS_GATEWAY}`);
console.log(`World version: ${WORLD_VERSION}`);
console.log(`World: ${WORLD_CID}`);
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
const HLS_BUFFER_LENGTH = 5 * 60; // 5 minutes
const HLS_BUFFER_SIZE = 1 * 1024 * 1024 * 1024; // 1 GB

// Entry point after bootstrapping IPFS
async function loadUserInterface(node) {
  // Load UI libraries
  log_ui(`Downloading UI libraries`);
  await Promise.all([loadScript(JSONLD_SRC)]);
  log_ui(`Finished downloading UI libraries`);

  // Check HLS video playback
  log_ui(`  HLS support: ${Hls.isSupported()}`);

  // TODO: Add fallback
  if (!Hls.isSupported()) {
    log_ui('HLS support is required');
    return;
  }

  const WORLD_URI = `${IPFS_GATEWAY}/ipfs/${WORLD_CID}/graph.json`;

  // Load world
  log_ui(`Loading world`);
  log_ui(`   URI: ${WORLD_URI}`);

  const response = await fetch(`${WORLD_URI}`);
  const responseJson = await response.json();

  // Parse JSON-LD. The JSON-LD document looks like:
  //
  //   {
  //     "@context": ...,
  //     "@graph": [
  //       ...
  //     ]
  //   }
  //
  // This is called "compacted form". The graph is a list of JSON-LD
  // objects. An object looks like:
  //
  //   {
  //     "@type": "VideoObject",
  //     "title": {
  //         "en": "Dubai Downtown Panorama"
  //     },
  //     "creator": "Swedrone",
  //     "license": "CC-BY-3.0",
  //     ...
  //  }
  //
  // When the JSON-LD document is expanded, the context is used to
  // reconstruct full URIs for each subject, predicate and object.
  // For the example above, when expanded, it looks like:
  //
  //   {
  //     "@type": [
  //       "http://schema.org/VideoObject"
  //     ],
  //     "http://purl.org/dc/terms/title": [
  //       {
  //         "@language": "en",
  //         "@value": "Dubai Downtown Panorama"
  //       }
  //     ],
  //     "http://purl.org/dc/terms/creator": [
  //       {
  //         "@value": "Swedrone"
  //       }
  //     ],
  //     "http://spdx.org/rdf/terms#licenseId": [
  //       {
  //         "@value": "Swedrone"
  //       }
  //     ],
  //     ...
  //    }
  //
  // When the document is expanded, fields that don't appear in the
  // context are dropped. We can expand the document and recompact,
  // which sanitizes data in the document.

  // Context is retrieved from the "@context" field of the JSON document
  const context = responseJson;

  // Expand the graph, dropping invalid fields
  const expanded = await jsonld.expand(responseJson);

  // Compact the graph, shortening the long URIs to field names for the
  // compacted document
  const compacted = await jsonld.compact(expanded, context);

  // The world is the list of objects in the "@graph" field
  const world = compacted['@graph'];

  // Extract video URIs
  const videos = [];
  for (const index in world) {
    const obj = world[index];
    if (obj['@type'] == 'VideoObject') {
      videos.push(obj.mediaStream[0].fileUrl);
    }
  }

  await handleVideos(videos);
}

// Do something with the known videos
async function handleVideos(videos) {
  // Index of the the background video from all videos in the world
  const WORLD_VIDEO_INDEX = Math.floor(Math.random() * videos.length);

  // Choose a video
  const fileName = videos[WORLD_VIDEO_INDEX];

  const videoUri = `${IPFS_GATEWAY}/ipfs/${WORLD_CID}/${fileName}`;

  const hls = new Hls({
    maxBufferLength: HLS_BUFFER_LENGTH,
    maxBufferSize: HLS_BUFFER_SIZE,
    maxMaxBufferSize: HLS_BUFFER_SIZE,
  });

  hls.loadSource(videoUri);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    log_ui(`Parsed HLS manifest`);

    var video = document.getElementById('backgroundVideo');
    hls.attachMedia(video);

    // Video will start soon, so show the volume indicator
    var volumeIcon = video.muted
      ? document.getElementById('volumeMuteIcon')
      : document.getElementById('volumeUpIcon');

    volumeIcon.style.display = 'block';
  });
}

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
  const video = document.getElementById('backgroundVideo');

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
  const gameCanvas = document.getElementById('gameCanvas');

  if (gameCanvas.requestFullscreen) {
    gameCanvas.requestFullscreen();
  } else if (gameCanvas.webkitRequestFullscreen) {
    gameCanvas.webkitRequestFullscreen();
  } else if (gameCanvas.mozRequestFullScreen) {
    gameCanvas.mozRequestFullScreen();
  } else if (gameCanvas.msRequestFullscreen) {
    gameCanvas.msRequestFullscreen();
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

//////////////////////////////////////////////////////////////////////////
// Async entry points
//////////////////////////////////////////////////////////////////////////

bootstrapIpfs();

// TODO: Move UI to IPFS
loadUserInterface(null);
