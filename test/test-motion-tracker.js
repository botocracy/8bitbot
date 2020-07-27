/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import { ImageData } from 'canvas';
import { spawn, Thread, Transfer, Worker } from 'threads';

import { performance } from 'perf_hooks';

// Video dimensions
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

// Promise that is resolved when a decoded frame is processed
let resolveFrameProcessed;

describe('Motion tracker', function () {
  before(async function () {
    // Motion tracker
    this.worker = await spawn(
      new Worker('../src/workers/motion_tracker_module')
    );
    this.worker
      .onFrameProcessed()
      .subscribe(
        ({ pts, sceneScore, points, rotationMatrix, translationVector }) => {
          const frameInfo = {
            pts: pts,
            sceneScore: sceneScore,
            points: points,
            rotationMatrix: rotationMatrix,
            translationVector: translationVector,
          };
          resolveFrameProcessed(frameInfo);
        }
      );
  });

  after(async function () {
    await Thread.terminate(this.worker);
  });

  it('should have spawned worker', async function () {
    chai.expect(this.worker).to.be.an('object');
  });

  it('should initialize the module worker', async function () {
    await this.worker.initialize();
  });

  it(`should open a stream of ${VIDEO_WIDTH}x${VIDEO_HEIGHT} video frames`, async function () {
    const result = await this.worker.open(VIDEO_WIDTH, VIDEO_HEIGHT);
    chai.expect(result, 'result of worker.open()').to.be.true;
  });

  it(`should process frames`, async function () {
    function getFrame(fill) {
      // Allocate new pixel data
      let videoBuffer = new ArrayBuffer(VIDEO_WIDTH * VIDEO_HEIGHT * 4);
      let videoData = new Uint8ClampedArray(videoBuffer);
      let videoFrame = new ImageData(videoData, VIDEO_WIDTH, VIDEO_HEIGHT);
      for (let i = 0; i < VIDEO_WIDTH * VIDEO_HEIGHT * 4; i++) {
        videoData[i] = fill;
      }
      return videoFrame;
    }

    /*
     * 0x00
     */

    let videoFrame = getFrame(0x00);
    this.frameProcessed = new Promise((resolve, reject) => {
      resolveFrameProcessed = resolve;
    });
    let result = await this.worker.addVideoFrame(
      performance.now(),
      Transfer(videoFrame.data.buffer),
      videoFrame.data.byteOffset,
      videoFrame.data.byteLength
    );
    let frameInfo = await this.frameProcessed;
    console.log(frameInfo); // TODO

    /*
     * 0x01
     */

    videoFrame = getFrame(0x01);
    this.frameProcessed = new Promise((resolve, reject) => {
      resolveFrameProcessed = resolve;
    });
    result = await this.worker.addVideoFrame(
      performance.now(),
      Transfer(videoFrame.data.buffer),
      videoFrame.data.byteOffset,
      videoFrame.data.byteLength
    );
    frameInfo = await this.frameProcessed;
    console.log(frameInfo); // TODO

    /*
     * 0x02
     */

    videoFrame = getFrame(0x02);
    this.frameProcessed = new Promise((resolve, reject) => {
      resolveFrameProcessed = resolve;
    });
    result = await this.worker.addVideoFrame(
      performance.now(),
      Transfer(videoFrame.data.buffer),
      videoFrame.data.byteOffset,
      videoFrame.data.byteLength
    );
    frameInfo = await this.frameProcessed;
    console.log(frameInfo); // TODO

    /*
     * 0xff
     */

    videoFrame = getFrame(0xff);
    this.frameProcessed = new Promise((resolve, reject) => {
      resolveFrameProcessed = resolve;
    });
    result = await this.worker.addVideoFrame(
      performance.now(),
      Transfer(videoFrame.data.buffer),
      videoFrame.data.byteOffset,
      videoFrame.data.byteLength
    );
    frameInfo = await this.frameProcessed;
    console.log(frameInfo); // TODO

    /*
     * 0x00
     */

    videoFrame = getFrame(0x00);
    this.frameProcessed = new Promise((resolve, reject) => {
      resolveFrameProcessed = resolve;
    });
    result = await this.worker.addVideoFrame(
      performance.now(),
      Transfer(videoFrame.data.buffer),
      videoFrame.data.byteOffset,
      videoFrame.data.byteLength
    );
    frameInfo = await this.frameProcessed;
    console.log(frameInfo); // TODO

    /*
     * 0xff
     */

    videoFrame = getFrame(0xff);
    this.frameProcessed = new Promise((resolve, reject) => {
      resolveFrameProcessed = resolve;
    });
    result = await this.worker.addVideoFrame(
      performance.now(),
      Transfer(videoFrame.data.buffer),
      videoFrame.data.byteOffset,
      videoFrame.data.byteLength
    );
    frameInfo = await this.frameProcessed;
    console.log(frameInfo); // TODO
  });

  it('should terminate worker', async function () {
    return Thread.terminate(this.worker);
  });
});
