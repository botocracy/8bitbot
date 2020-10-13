/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { VideoStreamingPlaylistType } from './video-streaming-playlist.type';
import { VideoFile } from './video-file.model';

export interface VideoStreamingPlaylist {
  id: number;
  type: VideoStreamingPlaylistType;
  playlistUrl: string;
  segmentsSha256Url: string;

  redundancies: {
    baseUrl: string;
  }[];

  files: VideoFile[];
}
