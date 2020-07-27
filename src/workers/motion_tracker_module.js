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
    return tracker.open(videoWidth, videoHeight);
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

    if (!tracker.addVideoFrame(pixelData)) {
      return false;
    }

    const sceneScore = tracker.sceneScore;
    const pointData = tracker.pointData;
    const pointSize = tracker.pointSize;
    const rotationMatrix = tracker.rotationMatrix;
    const translationVector = tracker.translationVector;

    // Get reference to WASM memory holding the points
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

    frameProcessedSubject.next({
      pts,
      sceneScore,
      points,
      rotationMatrix,
      translationVector,
    });

    return true;
  },

  onFrameProcessed() {
    return Observable.from(frameProcessedSubject);
  },
};

expose(motionTracker);
