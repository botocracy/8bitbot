/*
 * Copyright (C) 2019-2020 Marquise Stein
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

  addVideoFrame(frameId, data, dataSize, videoWidth, videoHeight) {
    // TODO
    sceneChangeSubject.next(frameId);

    if (data == null || dataSize <= 0 || videoWidth <= 0 || videoHeight <= 0) {
      return false;
    }

    if (!detector) {
      return false;
    }

    detector.addVideoFrame(data, dataSize, videoWidth, videoHeight);

    const state = detector.state;

    if (state == SceneDetectorState.Failed) {
      return false;
    }

    if (state == SceneDetectorState.SceneDetected) {
      sceneChangeSubject.next(frameId);
    }

    return true;
  },

  onSceneChange() {
    return Observable.from(sceneChangeSubject);
  },
};

expose(sceneDetector);
