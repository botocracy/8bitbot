/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

(function () {
  let motionTracker;

  // TODO: Prefetch and load initial memory .mem file
  self.Module = {};

  Module.onRuntimeInitialized = function () {
    // note that emscripten Module is not completely initialized until postRun

    self.MotionTracker = Module.MotionTracker;
    self.MotionTrackerState = Module.MotionTrackerState;

    motionTracker = new self.MotionTracker();

    postMessage({
      type: 'moduleInitialized',
    });
  };

  importScripts('motion_tracker.js');

  onmessage = function (event) {
    let msg = event.data;

    switch (msg.type) {
      case 'open':
        const videoWidth = msg.videoWidth;
        const videoHeight = msg.videoHeight;
        open(videoWidth, videoHeight);
        break;

      case 'addVideoFrame':
        const pts = msg.pts;
        const pixelBuffer = msg.pixelBuffer;
        const byteOffset = msg.byteOffset;
        const byteLength = msg.byteLength;

        const pixelData = new Uint8ClampedArray(
          pixelBuffer,
          byteOffset,
          byteLength
        );

        addVideoFrame(pts, pixelData);
        break;

      default:
        console.error(`Unknown message type: ${msg.type}`);
    }
  };

  function open(videoWidth, videoHeight) {
    if (!motionTracker) {
      postMessage({ error: 'Motion tracker is not initialized' });
      return;
    }

    if (!motionTracker.open(videoWidth, videoHeight)) {
      postMessage({ error: 'Failed to open motion tracker' });
    }
  }

  function addVideoFrame(pts, pixelData) {
    if (!motionTracker) {
      postMessage({ error: 'Motion tracker is not initialized' });
      return;
    }

    if (!motionTracker.addVideoFrame(pixelData)) {
      postMessage({ error: 'Failed to add frame to motion tracker' });
      return;
    }

    const sceneScore = motionTracker.sceneScore;
    const pointData = motionTracker.pointData;
    const pointSize = motionTracker.pointSize;
    const rotationMatrix = motionTracker.rotationMatrix;
    const translationVector = motionTracker.translationVector;

    // Get reference to WASM memory holding the points
    var points = new Uint8ClampedArray(
      Module.HEAPU8.buffer,
      pointData,
      pointSize
    );

    // Allocate new point data
    const pointBuffer = new ArrayBuffer(pointSize);
    const pointsCopy = new Uint8Array(pointBuffer);

    // Copy points
    pointsCopy.set(points);

    postMessage(
      {
        type: 'onFrameProcessed',
        pts: pts,
        sceneScore: sceneScore,
        pointsBuffer: pointsCopy.buffer,
        rotationMatrix: rotationMatrix,
        translationVector: translationVector,
      },
      [pointsCopy.buffer]
    );
  }
})();
