/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import WebTorrent from 'webtorrent';

import { fileSizeSI, getRtcConfig } from './utils';

// Sintel, a free, Creative Commons movie
var TORRENT_ID =
  'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';

// Maximum width or height of decoded image
const MAX_DECODED_SIZE = 512;

class TorrentDecoder {
  constructor() {
    // Create WebTorrent client
    this.client = new WebTorrent({
      tracker: {
        rtcConfig: getRtcConfig(),
      },
    });
    this.client.on('warning', function (err) {
      console.log(err);
    });
    this.client.on('error', function (err) {
      console.error(err);
    });

    // Promise that is resolved when a decoded frame is processed
    this.resolveFrameProcessed = null;

    // Download torrent metadata
    this.client.add(TORRENT_ID, this.handleTorrent);
  }

  async handleTorrent(torrent) {
    const blockSize = torrent.pieceLength;

    // Get the .mp4 file
    file = torrent.files.find(function (file) {
      return file.name.endsWith('.mp4');
    });

    console.log(`Streaming ${file.name} (${fileSizeSI(file.length)})`);

    /*
    // Create a readable stream
    const stream = file.createReadStream();

    // File data
    let fileChunks = [];
    let fileProgress = 0;
    const totalFileSize = file.length;

    // Debug logging
    let percent = 0;

    // Ready for data
    stream.on('data', (chunk) => {
      fileChunks.push(chunk);
      fileProgress += chunk.length;
      const newPercent = Math.round((100.0 * fileProgress) / totalFileSize);
      if (percent != newPercent) {
        console.log(`Torrent at ${newPercent}%`);
        percent = newPercent;
      }
    });

    // Wait for stream end
    await new Promise((resolve, reject) => {
      stream.on('end', () => {
        resolve();
      });
    });

    // Done with stream
    stream.destroy();
    stream = null;

    console.log(
      `Total chunks read: ${fileChunks.length}, total size: ${fileSizeSI(
        totalFileSize
      )}`
    );
    */
  }
}

export { TorrentDecoder };
