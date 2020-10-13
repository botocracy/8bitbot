/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { basename, dirname } from 'path';

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
