/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

const globals = require('rollup-plugin-node-globals');
const polyfills = require('rollup-plugin-node-polyfills');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;

module.exports = {
  scripts: {
    'mount:public': 'mount public --to /',
    'mount:src': 'mount src --to /_dist_',
  },
  devOptions: {
    bundle: false,
  },
  buildOptions: {
    minify: false,
  },
  plugins: ['@snowpack/plugin-typescript'],
  install: ['hls.js', 'jsonld'],
  installOptions: {
    sourceMap: true,
    treeshake: true,
    rollup: {
      plugins: [
        // Fix "Uncaught TypeError: bufferEs6.hasOwnProperty is not a function"
        resolve({ preferBuiltins: false }),
        globals(),
        polyfills(),
      ],
    },
  },
};
