/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

// SI file size strings
function fileSizeSI(size) {
  let exp = (Math.log(size) / Math.log(1e3)) | 0;

  return (
    (size / Math.pow(1e3, exp)).toFixed(0) +
    ' ' +
    (exp ? 'kMGTPEZY'[--exp] + 'B' : 'Bytes')
  );
}

function getRtcConfig() {
  return {
    iceServers: [
      {
        urls: 'stun:stun.stunprotocol.org',
      },
      {
        urls: 'stun:stun.framasoft.org',
      },
    ],
  };
}

// ---------------------------------------------------------------------------

export { fileSizeSI, getRtcConfig };
