/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { Segment } from 'p2p-media-loader-core';
import { RedundancyUrlManager } from './redundancy-url-manager';

function segmentUrlBuilderFactory(redundancyUrlManager: RedundancyUrlManager) {
  return function segmentBuilder(segment: Segment) {
    return redundancyUrlManager.buildUrl(segment.url);
  };
}

// ---------------------------------------------------------------------------

export { segmentUrlBuilderFactory };
