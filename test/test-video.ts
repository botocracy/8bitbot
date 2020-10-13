/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import './test-video.scss';

window.addEventListener('load', async () => {
  const urlParts = window.location.href.split('/');
  const lastPart = urlParts[urlParts.length - 1];

  const isPlaylist = window.location.pathname.startsWith('/video-playlists');

  const elementId =
    lastPart.indexOf('?') === -1 ? lastPart : lastPart.split('?')[0];

  const iframe = document.createElement('iframe');

  iframe.src = isPlaylist
    ? `/videos/embed/${elementId}?api=1`
    : `/video-playlists/embed/${elementId}?api=1`;

  const mainElement = document.querySelector('#host');

  mainElement.appendChild(iframe);

  console.log('Document finished loading');

  const player = new PeerTubePlayer(document.querySelector('iframe'));
});
