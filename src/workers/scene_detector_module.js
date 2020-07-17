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
let sceneChangeSubject = new Subject();

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

    const param = ''; // TODO
    detector = new Module.SceneDetector(new TextEncoder('utf-8').encode(param));
  },

  async addVideoFrame(frameId, data, videoWidth, videoHeight) {
    if (!detector) {
      throw new Error('Scene detector is not initialized');
    }

    detector.addVideoFrame(data, videoWidth, videoHeight);

    const state = detector.state;

    if (state == Module.SceneDetectorState.Failed) {
      // TODO: Handle failure
      return false;
    }

    if (state == Module.SceneDetectorState.SceneDetected) {
      sceneChangeSubject.next(frameId);
    }

    return true;
  },

  onSceneChange() {
    return Observable.from(sceneChangeSubject);
  },
};

expose(sceneDetector);
