/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

export class VideoFileMetadata {
  streams: { [x: string]: any; [x: number]: any }[];
  format: { [x: string]: any; [x: number]: any };
  chapters: any[];

  constructor(hash: { chapters: any[]; format: any; streams: any[] }) {
    this.chapters = hash.chapters;
    this.format = hash.format;
    this.streams = hash.streams;

    delete this.format.filename;
  }
}
