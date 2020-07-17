/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { Subject, Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import Module from '../../public/stream_decoder/stream_decoder.js';

// Streaming decoder
let decoder;

// Video buffer pool
let videoBuffers = [];

// Streaming worker results
let frameAvailableSubject = new Subject();

// Promise that is resolved when module runtime is initialized
let resolveInitialize;
let runtimeInitialized = new Promise((resolve, reject) => {
  resolveInitialize = resolve;
});

// Called when WASM module is initialized
Module.onRuntimeInitialized = (_) => {
  resolveInitialize();
};

const streamDecoder = {
  async initialize(streamUrl) {
    await runtimeInitialized;

    decoder = new Module.StreamDecoder(
      new TextEncoder('utf-8').encode(streamUrl)
    );
  },

  async addPacket(packet) {
    if (!decoder) {
      throw new Error('Stream decoder is not initialized');
    }

    decoder.addPacket(packet);

    let state = decoder.state;

    if (state == Module.StreamDecoderState.Failed) {
      // TODO: Handle failure
      return false;
    }

    while (state == Module.StreamDecoderState.HasFrame) {
      const frameWidth = decoder.frameWidth;
      const frameHeight = decoder.frameHeight;
      const frameSize = decoder.frameSize;

      if (frameWidth > 0 && frameHeight > 0 && frameSize > 0) {
        const frameData = decoder.getFrame();

        var src = new Uint8ClampedArray(
          Module.HEAPU8.buffer,
          frameData,
          frameSize
        );

        var buffer = videoBuffers.pop();
        if (!buffer) {
          buffer = new ArrayBuffer(frameSize);
        }

        const pixelData = new Uint8ClampedArray(buffer);

        pixelData.set(src);

        frameAvailableSubject.next({ pixelData, frameWidth, frameHeight });
      }

      state = decoder.state;
    }

    return true;
  },

  onFrameAvailable() {
    return Observable.from(frameAvailableSubject);
  },
};

expose(streamDecoder);
