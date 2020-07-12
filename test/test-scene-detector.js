/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import { spawn, Thread, Worker } from 'threads';

// Promise that is resolved when a scene change is detected
let resolveSceneChanged;
let sceneChanged = new Promise((resolve, reject) => {
  resolveSceneChanged = resolve;
});

const MAGIC_FRAME_ID = '12345';

describe('Scene detector', function () {
  before(async function () {
    this.worker = await spawn(
      new Worker('../src/workers/scene_detector_module')
    );

    this.worker.onSceneChange().subscribe((frameId) => {
      resolveSceneChanged(frameId);
    });
  });

  after(async function () {
    await Thread.terminate(this.worker);
  });

  it('should have spawned a worker', async function () {
    chai.expect(this.worker).to.be.an('object');
  });

  it('should initialize the module', async function () {
    return this.worker.initialize();
  });

  it('should add a video frame', async function () {
    // TODO
    const result = await this.worker.addVideoFrame(
      MAGIC_FRAME_ID,
      null,
      0,
      0,
      0
    );
    chai.expect(result, 'addVideoFrame() result').to.be.a('boolean');
  });

  it('should detect a scene change', async function () {
    const result = await sceneChanged;
    chai.expect(result, 'frame ID').to.equal(MAGIC_FRAME_ID);
  });

  it('should terminate worker', async function () {
    await Thread.terminate(this.worker);
  });
});
