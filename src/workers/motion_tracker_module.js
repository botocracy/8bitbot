/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { Subject, Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import Module from '../../public/motion_tracker/motion_tracker.js';

// Motion tracker
let tracker;

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

const motionTracker = {
  async initialize() {
    await runtimeInitialized;

    tracker = new Module.MotionTracker();
  },

  async open(videoWidth, videoHeight) {
    return tracker.initialize(videoWidth, videoHeight);
  },

  async addVideoFrame(pts, pixelBuffer, byteOffset, byteLength) {
    if (!tracker) {
      throw new Error('Motion tracker is not initialized');
    }

    const pixelData = new Uint8ClampedArray(
      pixelBuffer,
      byteOffset,
      byteLength
    );

    const frameInfo = tracker.addVideoFrame(pixelData);

    const sceneScore = frameInfo.sceneScore;

    // Get reference to WASM memory holding the points
    /*
    var pointHeap = new Uint8ClampedArray(
      Module.HEAPU8.buffer,
      pointData,
      pointSize
    );

    // Allocate new point data
    const pointBuffer = new ArrayBuffer(pointSize);
    const points = new Uint8Array(pointBuffer);

    // Copy points
    points.set(pointHeap);
    */

    // TODO
    const pointBuffer = new ArrayBuffer(10);
    const points = new Uint8Array(pointBuffer);

    const rotationMatrix = null; // TODO
    const translationVector = null; // TODO

    frameProcessedSubject.next({
      pts,
      sceneScore,
      points,
      rotationMatrix,
      translationVector,
    });

    return true;
  },

  async close() {
    tracker.deinitialize();
  },

  onFrameProcessed() {
    return Observable.from(frameProcessedSubject);
  },
};

expose(motionTracker);
