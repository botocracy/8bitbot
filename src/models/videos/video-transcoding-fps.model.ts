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

export type VideoTranscodingFPS = {
  MIN: number;
  STANDARD: number[];
  HD_STANDARD: number[];
  AVERAGE: number;
  MAX: number;
  KEEP_ORIGIN_FPS_RESOLUTION_MIN: number;
};
