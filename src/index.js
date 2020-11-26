/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import Hls from 'hls.js';

import { IPFS_GATEWAY } from './ipfs';
import { World } from './world';

const world = new World();

//////////////////////////////////////////////////////////////////////////
// Application info
//////////////////////////////////////////////////////////////////////////

console.log('-------------------------------------');
console.log(`${document.title}`);
console.log(`Gateway: ${IPFS_GATEWAY}`);
console.log(`World version: ${world.version}`);
console.log(`World: ${world.cid}`);
console.log('-------------------------------------');

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

//////////////////////////////////////////////////////////////////////////
// Utilities
//////////////////////////////////////////////////////////////////////////

function log_ui(message) {
  console.log(`[UI    ] ${message}`);
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

// TODO: Move UI to IPFS
loadUserInterface(null);
