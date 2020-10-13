/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
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
