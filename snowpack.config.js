// Plugin: https://github.com/ionic-team/rollup-plugin-node-polyfills

globals = require('rollup-plugin-node-globals');
polyfills = require('rollup-plugin-node-polyfills');

module.exports = {
  scripts: {
    'mount:public': 'mount public --to /',
    'mount:src': 'mount src --to /_dist_',
  },
  plugins: [
    [
      '@snowpack/plugin-babel',
      '@snowpack/plugin-webpack',
      {
        sourceMap: true,
      },
    ],
  ],
  devOptions: {
    bundle: false,
  },
  install: ['hls.js', 'hlsjs-ipfs-loader', 'ipfs', 'orbit-db', 'webtorrent'],
  installOptions: {
    sourceMap: true,
    treeshake: true,
    rollup: {
      plugins: [globals(), polyfills()],
    },
  },
};
