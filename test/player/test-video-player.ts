/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { expect } from 'chai';

import { loadVideoInfo } from '../../src/peertube-api';
import { VideoPlayer } from '../../src/player/video-player';

const VIDEO_ID = '5ea4b933-26e2-4813-a2b2-7c99c8626a60'; // Dubai Creek by Swedrone

describe('VideoPlayer', function () {
  before(async function () {
    this.videoInfo = null;
    this.player = null;
  });

  it('should download video info', async function () {
    this.timeout(5000);

    this.videoInfo = await loadVideoInfo(VIDEO_ID);

    expect(this.videoInfo).to.be.an('object');
  });

  it('should create a player', async function () {
    expect(this.videoInfo).to.be.an('object');

    console.log(`Opening video: ${this.videoInfo.name}`);

    // TODO: Pass video element to constructor
    //const videoElement = document.getElementById('videoBackground');

    this.player = new VideoPlayer(null);

    expect(this.player).to.be.an('object');
  });

  it('should start p2p-media-loader playback', async function () {
    this.timeout(3000);

    expect(this.player).to.be.an('object');

    await this.player.open(this.videoInfo, 'p2p-media-loader');

    console.log(`Mode: ${this.player.mode}`);
    expect(this.player.mode).to.equal('p2p-media-loader');
  });

  it('should start webtorrent playback', async function () {
    expect(this.player).to.be.an('object');

    await this.player.open(this.videoInfo, 'webtorrent');

    console.log(`Mode: ${this.player.mode}`);
    expect(this.player.mode).to.equal('webtorrent');
  });
});
