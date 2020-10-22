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

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function (filename) {
  return splitPathRe.exec(filename).slice(1);
};

function dirname(path) {
  var result = splitPath(path),
    root = result[0],
    dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
}

function basename(path) {
  return splitPath(path)[2];
}

class RedundancyUrlManager {
  constructor(private baseUrls: string[] = []) {
    // empty
  }

  removeBySegmentUrl(segmentUrl: string) {
    console.log('Removing redundancy of segment URL %s.', segmentUrl);

    const baseUrl = dirname(segmentUrl);

    this.baseUrls = this.baseUrls.filter(
      (u) => u !== baseUrl && u !== baseUrl + '/'
    );
  }

  buildUrl(url: string) {
    const max = this.baseUrls.length + 1;
    const i = this.getRandomInt(max);

    if (i === max - 1) return url;

    const newBaseUrl = this.baseUrls[i];
    const slashPart = newBaseUrl.endsWith('/') ? '' : '/';

    return newBaseUrl + slashPart + basename(url);
  }

  countBaseUrls() {
    return this.baseUrls.length;
  }

  private getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
  }
}

// ---------------------------------------------------------------------------

export { RedundancyUrlManager };
