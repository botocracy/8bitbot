/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

(function () {
  let detector;

  // TODO: Prefetch and load initial memory .mem file
  self.Module = {};

  Module.onRuntimeInitialized = function () {
    // note that emscripten Module is not completely initialized until postRun

    self.SceneDetector = Module.SceneDetector;
    self.SceneDetectorState = Module.SceneDetectorState;

    const param = ''; // TODO
    detector = new SceneDetector(new TextEncoder('utf-8').encode(param));

    postMessage({
      type: 'moduleInitialized',
    });
  };

  importScripts('scene_detector.js');
  console.log('Loaded scene_detector.js');

  onmessage = function (ev) {
    let msg = ev.data;

    switch (msg.type) {
      case 'addVideoFrame':
        const frameId = msg.frameId;
        const pixelData = new Uint8ClampedArray(msg.buffer);
        const videoWidth = msg.videoWidth;
        const videoHeight = msg.videoHeight;
        addVideoFrame(frameId, pixelData, videoWidth, videoHeight);
        break;

      default:
        console.error(`Unknown message type: ${msg.type}`);
    }
  };

  function addVideoFrame(frameId, pixelData, videoWidth, videoHeight) {
    if (!detector) {
      throw new Error('Scene detector is not initialized');
    }

    detector.addVideoFrame(pixelData, videoWidth, videoHeight);
    const state = detector.state;

    if (state == Module.SceneDetectorState.Failed) {
      // TODO: Recover from error state
      return;
    }

    if (state == Module.SceneDetectorState.SceneDetected) {
      postMessage({
        type: 'onSceneChange',
        frameId: frameId,
      });
    }
  }
})();
