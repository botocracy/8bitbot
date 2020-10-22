/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

/**
 * PeerTube API functions
 **/

const PEERTUBE_INSTANCE = 'https://diode.zone';

function getVideoUrl(videoId: string): string {
  return `${PEERTUBE_INSTANCE}/api/v1/videos/${videoId}`;
}

function getPreviewUrl(videoId: string): string {
  return `${PEERTUBE_INSTANCE}/static/previews/${videoId}.jpg`;
}

// TODO: Struct return type
async function loadVideoInfo(videoId: string): Promise<any> {
  const videoResponse: Response = await fetch(getVideoUrl(videoId));

  if (!videoResponse.ok) {
    console.error(`Failed to fetch ${getVideoUrl(videoId)}`);
    return null;
  }

  const videoInfo: Promise<any> = videoResponse.json();
  return videoInfo;
}

export { getVideoUrl, getPreviewUrl, loadVideoInfo };
