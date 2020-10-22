/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * This file is derived from the PeerTube project, available under
 * the AGPL 3.0 (or later) license. https://github.com/Chocobozzz/PeerTube
 *
 * SPDX-License-Identifier: Apache-2.0 AND AGPL-3.0-or-later
 * See LICENSE.txt for more information.
 */

import { Segment } from 'p2p-media-loader-core';

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function (filename) {
  return splitPathRe.exec(filename).slice(1);
};

function basename(path) {
  return splitPath(path)[2];
}

function segmentValidatorFactory(segmentsSha256Url: string) {
  const segmentsJSON = fetchSha256Segments(segmentsSha256Url);
  const regex = /bytes=(\d+)-(\d+)/;

  return async function segmentValidator(segment: Segment) {
    const filename = basename(segment.url);
    const captured = regex.exec(segment.range);

    const range = captured[1] + '-' + captured[2];

    const hashShouldBe = (await segmentsJSON)[filename][range];
    if (hashShouldBe === undefined) {
      throw new Error(
        `Unknown segment name ${filename}/${range} in segment validator`
      );
    }

    const calculatedSha = bufferToEx(await sha256(segment.data));
    if (calculatedSha !== hashShouldBe) {
      throw new Error(
        `Hashes does not correspond for segment ${filename}/${range}` +
          `(expected: ${hashShouldBe} instead of ${calculatedSha})`
      );
    }
  };
}

// ---------------------------------------------------------------------------

export { segmentValidatorFactory };

// ---------------------------------------------------------------------------

async function fetchSha256Segments(url: string): Promise<Response> {
  return fetch(url)
    .then((res) => res.json())
    .catch((err) => {
      console.error('Cannot get sha256 segments', err);
      return {};
    });
}

async function sha256(data: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', data);
}

// Thanks: https://stackoverflow.com/a/53307879
function bufferToEx(buffer: ArrayBuffer): string {
  let s = '';
  const h = '0123456789abcdef';
  const o = new Uint8Array(buffer);

  o.forEach((v: any) => (s += h[v >> 4] + h[v & 15]));

  return s;
}
