/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import Hls from 'hls.js';

describe('hls.js', function () {
  it('should be imported', async function () {
    // If no DOM is available, Hls.js will import an empty object
    chai.expect(Hls, 'HLS import').to.not.be.an('object');
  });

  it('should have isSupported() function', async function () {
    // MediaStream API not supported in Node.js
    chai.expect(Hls.isSupported(), 'HLS support').to.be.a('boolean');
  });
});
