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

//import { AccountSummary } from '../../actors/index'
import { /*VideoChannelSummary,*/ VideoConstant } from '..';
//import { VideoPlaylistPrivacy } from './video-playlist-privacy.model'
import { VideoPlaylistType } from './video-playlist-type.model';

export interface VideoPlaylist {
  id: number;
  uuid: string;
  isLocal: boolean;

  displayName: string;
  description: string;
  //privacy: VideoConstant<VideoPlaylistPrivacy>

  thumbnailPath: string;

  videosLength: number;

  type: VideoConstant<VideoPlaylistType>;

  embedPath: string;

  createdAt: Date | string;
  updatedAt: Date | string;

  //ownerAccount: AccountSummary
  //videoChannel?: VideoChannelSummary
}
