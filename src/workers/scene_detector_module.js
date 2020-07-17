/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { Subject, Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import Module from '../../public/scene_detector/scene_detector.js';

// Scene detector
let detector;

// Streaming worker results
let frameProcessedSubject = new Subject();

// Promise that is resolved when module runtime is initialized
let resolveInitialize;
let runtimeInitialized = new Promise((resolve, reject) => {
  resolveInitialize = resolve;
});

// Called when WASM module is initialized
Module.onRuntimeInitialized = (_) => {
  resolveInitialize();
};

const sceneDetector = {
  async initialize() {
    await runtimeInitialized;

    detector = new Module.SceneDetector();
  },

  async addVideoFrame(
    frameId,
    pixelBuffer,
    byteOffset,
    byteLength,
    videoWidth,
    videoHeight
  ) {
    if (!detector) {
      throw new Error('Scene detector is not initialized');
    }

    const pixelData = new Uint8ClampedArray(
      pixelBuffer,
      byteOffset,
      byteLength
    );

    detector.addVideoFrame(pixelData, videoWidth, videoHeight);
    const state = detector.state;

    if (state == Module.SceneDetectorState.Failed) {
      return false;
    }

    const sceneChange = state == Module.SceneDetectorState.SceneDetected;
    frameProcessedSubject.next({ frameId, sceneChange });

    return true;
  },

  onFrameProcessed() {
    return Observable.from(frameProcessedSubject);
  },
};

expose(sceneDetector);
