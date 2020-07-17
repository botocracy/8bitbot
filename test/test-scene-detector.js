/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import { ImageData } from 'canvas';
import { spawn, Thread, Worker } from 'threads';
import WebTorrent from 'webtorrent';

import { fileSizeSI, getRtcConfig } from '../src/utils';

// Sintel, a free, Creative Commons movie
var torrentId =
  'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';

const MAGIC_FRAME_ID = '12345';

// Promise that is resolved when a decoded frame is available
let resolveFrameAvailable;
let frameAvailable = new Promise((resolve, reject) => {
  resolveFrameAvailable = resolve;
});

// Promise that is resolved when a scene change is detected
let resolveSceneChanged;
let sceneChanged = new Promise((resolve, reject) => {
  resolveSceneChanged = resolve;
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Scene detector', function () {
  before(async function () {
    this.stream = null;
    this.streamUrl = null;
    this.fileChunks = [];
    this.videoFrames = [];
    this.sceneFrameIds = [];

    this.decoderWorker = await spawn(
      new Worker('../src/workers/stream_decoder_module')
    );
    this.decoderWorker
      .onFrameAvailable()
      .subscribe(({ pixelData, frameWidth, frameHeight }) => {
        const videoFrame = new ImageData(pixelData, frameWidth, frameHeight);

        resolveFrameAvailable(videoFrame);
        this.videoFrames.push(videoFrame);
      });

    this.detectorWorker = await spawn(
      new Worker('../src/workers/scene_detector_module')
    );
    this.detectorWorker.onSceneChange().subscribe((frameId) => {
      resolveSceneChanged(frameId);
      this.sceneFrameIds.push(frameId);
    });

    this.client = new WebTorrent({
      tracker: {
        rtcConfig: getRtcConfig(),
      },
    });
    this.client.on('error', function (err) {
      chai.assert.fail(err);
    });
    this.client.on('warning', function (err) {
      chai.assert.fail(err);
    });
  });

  after(async function () {
    if (this.stream) {
      this.stream.destroy();
    }
    if (this.client) {
      this.client.destroy();
    }
    await Thread.terminate(this.detectorWorker);
    await Thread.terminate(this.decoderWorker);
  });

  it('should have spawned workers', async function () {
    chai.expect(this.decoderWorker).to.be.an('object');
    chai.expect(this.detectorWorker).to.be.an('object');
  });

  it('should initialize the modules', async function () {
    return Promise.all([
      this.decoderWorker.initialize(),
      this.detectorWorker.initialize(),
    ]);
  });

  it('should download torrent metadata within 10s', function (done) {
    this.timeout(10 * 1000);

    this.client.add(torrentId, function (_) {
      done();
    });
  });

  it('should stream video for up to 5s', async function () {
    this.timeout(6 * 1000);

    // Total size of processed data
    let totalSize = 0;

    // Get the .mp4 file
    var file = this.client.torrents[0].files.find(function (file) {
      return file.name.endsWith('.mp4');
    });

    chai.expect(file.path).to.be.a('string');

    // Create a readable stream
    this.stream = file.createReadStream();
    this.streamUrl = file.path;

    console.log(`  Streaming ${this.streamUrl} (${fileSizeSI(file.length)})`);

    // Ready for data
    this.stream.on('data', (chunk) => {
      totalSize += chunk.length;
      this.fileChunks.push(chunk);
    });

    await Promise.race([
      new Promise((resolve, reject) => {
        this.stream.on('end', () => {
          resolve();
        });
      }),
      sleep(5 * 1000),
    ]);

    this.stream.destroy();
    this.stream = null;

    console.log(
      `  Total chunks read: ${this.fileChunks.length}, total size: ${fileSizeSI(
        totalSize
      )}`
    );

    chai.expect(this.fileChunks.length).to.be.greaterThan(0);
    chai.expect(totalSize).to.be.greaterThan(0);
  });

  it('should decode file data', async function () {
    chai.expect(this.fileChunks.length).to.be.greaterThan(0);

    for (const chunk of this.fileChunks) {
      const result = await this.decoderWorker.addPacket(chunk);
      chai.expect(result, 'result of decoderWorker.addPacket()').to.be.true;
    }

    chai
      .expect(this.videoFrames.length, 'number of video frames')
      .to.equal(this.fileChunks.length);
  });

  it('should receive a frame', async function () {
    const result = await frameAvailable;
    chai.expect(result.bufferSize, 'video frame size').to.not.equal(0);
  });

  it('should stream to scene detector', async function () {
    chai.expect(this.videoFrames.length).to.be.greaterThan(0);

    for (const frame of this.videoFrames) {
      const data = frame.data;
      const imageWidth = frame.width;
      const imageHeight = frame.height;

      const result = await this.detectorWorker.addVideoFrame(
        MAGIC_FRAME_ID,
        data,
        imageWidth,
        imageHeight
      );

      chai.expect(result, 'result of detectorWorker.addVideoFrame()').to.be
        .true;
    }

    chai.expect(this.sceneFrameIds.length).to.equal(this.fileChunks.length);
  });

  it('should detect a scene change', async function () {
    this.timeout(100);

    const result = await sceneChanged;
    chai.expect(result, 'frame ID').to.equal(MAGIC_FRAME_ID);

    chai.expect(this.sceneFrameIds.length).to.be.greaterThan(0);
    console.log(`  Detected ${this.sceneFrameIds.length - 1} scene changes`);
  });

  it('should terminate webtorrent client', async function () {
    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }
    this.client.destroy();
    this.client = null;
  });

  it('should terminate workers', async function () {
    return Promise.all([
      Thread.terminate(this.detectorWorker),
      Thread.terminate(this.decoderWorker),
    ]);
  });
});
