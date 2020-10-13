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

import { VideoConstant } from './video-constant.model';
import { VideoFileMetadata } from './video-file-metadata';
import { VideoResolution } from './video-resolution.enum';

export interface VideoFile {
  magnetUri: string;
  resolution: VideoConstant<VideoResolution>;
  size: number; // Bytes
  torrentUrl: string;
  torrentDownloadUrl: string;
  fileUrl: string;
  fileDownloadUrl: string;
  fps: number;
  metadata?: VideoFileMetadata;
  metadataUrl?: string;
}
