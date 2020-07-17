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
import WebTorrent from 'webtorrent';

import { fileSizeSI, getRtcConfig } from '../src/utils';

// Sintel, a free, Creative Commons movie
var TORRENT_ID =
  'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';

// Maximum width or height of decoded image
const MAX_DECODED_SIZE = 256;

// Number of frames to run through the motion tracker
const PROCESS_FRAMES = 10;

// Promise that is resolved when a decoded frame is processed
let resolveFrameProcessed;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Stream decoder', function () {
  before(async function () {
    this.timeout(5000); // TODO

    // Torrent parameters
    this.blockSize = 0;

    // File parameters
    this.file = null;

    // Stream parameters
    this.fileChunks = [];

    // Video parameters
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.frameProcessed = null;

    // Scene parameters
    this.frameCount = 0;
    this.sceneFrameIds = [];

    // Stream decoder
    this.decoderWorker = await spawn(
      new Worker('../src/workers/stream_decoder_module')
    );
    this.decoderWorker
      .onMetadataAvailable()
      .subscribe(({ frameSize, frameWidth, frameHeight }) => {
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
      });
    this.decoderWorker.onFrameAvailable().subscribe(async (buffer) => {
      const pixelData = new Uint8ClampedArray(buffer);
      const videoFrame = new ImageData(
        pixelData,
        this.frameWidth,
        this.frameHeight
      );

      chai.expect(videoFrame.data.buffer.byteLength).to.equal(pixelData.length);
      chai.expect(videoFrame.width).to.equal(this.frameWidth);
      chai.expect(videoFrame.height).to.equal(this.frameHeight);

      /* TODO
      const result = await this.trackerWorker.addVideoFrame(
        this.frameCount++,
        Transfer(videoFrame.data.buffer),
        videoFrame.byteOffset,
        videoFrame.byteLength
      );
      chai.expect(result, 'result of trackerWorker.addVideoFrame()').to.be.true;
      */

      this.sceneFrameIds.push(this.frameCount++);
      resolveFrameProcessed();
    });
    this.decoderWorker.onVideoEnded().subscribe(async () => {
      // TODO
      console.log(`  Video ended`);
    });

    // Motion tracker
    this.trackerWorker = await spawn(
      new Worker('../src/workers/motion_tracker_module')
    );
    this.trackerWorker
      .onFrameProcessed()
      .subscribe(({ frameId, sceneChange }) => {
        this.sceneFrameIds.push(frameId);
        resolveFrameProcessed();
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
    if (this.client) {
      this.client.destroy();
    }
    await Thread.terminate(this.trackerWorker);
    await Thread.terminate(this.decoderWorker);
  });

  it('should have spawned workers', async function () {
    chai.expect(this.decoderWorker).to.be.an('object');
    chai.expect(this.trackerWorker).to.be.an('object');
  });

  it('should download torrent metadata within 10s', function (done) {
    this.timeout(10 * 1000);

    self = this;
    this.client.add(TORRENT_ID, function (torrent) {
      self.blockSize = torrent.pieceLength;
      console.log(`  Block size: ${self.blockSize}`);
      chai.expect(self.blockSize).to.be.greaterThan(0);
      done();
    });
  });

  it('should find an mp4 file', async function () {
    // Get the .mp4 file
    this.file = this.client.torrents[0].files.find(function (file) {
      return file.name.endsWith('.mp4');
    });

    chai.expect(this.file.name).to.be.a('string');
  });

  it('should initialize the module workers', async function () {
    chai.expect(this.file.name).to.be.a('string');
    chai.expect(this.blockSize).to.be.greaterThan(0);

    return Promise.all([
      this.decoderWorker.initialize(
        this.file.name,
        this.blockSize,
        MAX_DECODED_SIZE
      ),
      this.trackerWorker.initialize(),
    ]);
  });

  it('should stream video for up to 30s', async function () {
    this.timeout(31 * 1000);

    // Total size of processed data
    let totalSize = 0;

    // Create a readable stream
    const stream = this.file.createReadStream();

    console.log(
      `  Streaming ${this.file.name} (${fileSizeSI(this.file.length)})`
    );

    // Ready for data
    stream.on('data', (chunk) => {
      totalSize += chunk.length;
      this.fileChunks.push(chunk);
    });

    // Wait for stream end or timeout, whichever occurs first
    await Promise.race([
      new Promise((resolve, reject) => {
        stream.on('end', () => {
          resolve();
        });
      }),
      sleep(30 * 1000),
    ]);

    // Done with stream
    stream.destroy();

    console.log(
      `  Total chunks read: ${this.fileChunks.length}, total size: ${fileSizeSI(
        totalSize
      )}`
    );

    chai.expect(this.fileChunks.length).to.be.greaterThan(0);
    chai.expect(totalSize).to.be.greaterThan(0);
  });

  it('should stream file data to decoder', async function () {
    this.timeout(10 * 1000);

    chai.expect(this.fileChunks.length).to.be.greaterThan(0);

    for (const chunk of this.fileChunks) {
      const result = await this.decoderWorker.addPacket(
        Transfer(chunk.buffer),
        chunk.byteOffset,
        chunk.byteLength
      );
      chai.expect(result, 'result of decoderWorker.addPacket()').to.be.true;
    }
  });

  it('should open the video', async function () {
    this.timeout(10 * 1000);

    const result = await this.decoderWorker.openVideo();
    chai.expect(result, 'result of decoderWorker.openVideo()').to.be.true;

    chai.expect(this.frameWidth).to.be.greaterThan(0);
    chai.expect(this.frameHeight).to.be.greaterThan(0);
  });

  it(`should decode and process ${PROCESS_FRAMES} frames`, async function () {
    chai.expect(this.frameWidth).to.be.greaterThan(0);
    chai.expect(this.frameHeight).to.be.greaterThan(0);

    for (let frameCount = 0; frameCount < PROCESS_FRAMES; frameCount++) {
      this.frameProcessed = new Promise((resolve, reject) => {
        resolveFrameProcessed = resolve;
      });
      if (!(await this.decoderWorker.decode())) {
        break;
      }
      await this.frameProcessed;
    }

    console.log(`  Processed ${this.sceneFrameIds.length} scenes`);
    chai.expect(this.sceneFrameIds.length).to.equal(PROCESS_FRAMES);
  });

  it('should terminate webtorrent client', async function () {
    this.client.destroy();
    this.client = null;
  });

  it('should terminate workers', async function () {
    return Promise.all([
      Thread.terminate(this.decoderWorker),
      Thread.terminate(this.trackerWorker),
    ]);
  });
});
