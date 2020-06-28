/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import WebTorrent from 'webtorrent';

import { fileSizeSI, getRtcConfig } from '../src/utils';

// Sintel, a free, Creative Commons movie
var torrentId =
  'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';

describe('WebTorrent', function () {
  before(async function () {
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
    this.client.destroy();
  });

  it('should be imported', async function () {
    chai.expect(this.client, 'WebTorrent client').to.be.an('object');
  });

  it('should have WEBRTC_SUPPORT property', async function () {
    // WebRTC not supported in Node.js
    chai.expect(WebTorrent.WEBRTC_SUPPORT).to.be.a('boolean');
  });

  it('should download torrent metadata within 10s', function (done) {
    this.timeout(10000);

    this.client.add(torrentId, function (torrent) {
      // Got torrent metadata
      console.log(
        `  Client is downloading "${torrent.name}" (${fileSizeSI(
          torrent.length
        )})`
      );

      torrent.files.forEach(function (file) {
        console.log(
          `  Torrent has file "${file.path}" (${fileSizeSI(file.length)})`
        );
      });

      done();
    });
  });

  it('should stream a file', function (done) {
    this.timeout(10000);

    const torrents = this.client.torrents;

    chai.expect(torrents.length).to.equal(1);

    // Get the .mp4 file
    var file = torrents[0].files.find(function (file) {
      return file.name.endsWith('.mp4');
    });

    // Create a readable stream
    const stream = file.createReadStream();

    // Ready for data
    stream.on('data', (chunk) => {
      console.log(`  Chunk size is ${fileSizeSI(chunk.length)}`);
      stream.destroy();
      done();
    });
  });
});
