/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';

import { World } from '../src/world';

describe('World', function () {
  before(function () {
    this.world = new World();
  });

  it('should construct World', async function () {
    chai.expect(this.world).to.be.an('object');
  });

  it('should provide video URIs', async function () {
    chai
      .expect(await this.world.getVideoHlsUri(), 'HLS video URI')
      .to.be.a('string');
    chai
      .expect(await this.world.getVideoMp4Uri(), 'MP4 video URI')
      .to.be.a('string');
  });
});
