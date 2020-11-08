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

//import { Video } from '../video.model'

export const enum VideoPlaylistElementType {
  REGULAR = 0,
  DELETED = 1,
  PRIVATE = 2,
  UNAVAILABLE = 3, // Blacklisted, blocked by the user/instance, NSFW...
}

export interface VideoPlaylistElement {
  id: number;
  position: number;
  startTimestamp: number;
  stopTimestamp: number;

  type: VideoPlaylistElementType;

  //video?: Video
}
