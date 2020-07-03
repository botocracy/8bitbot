// Plugin: https://github.com/ionic-team/rollup-plugin-node-polyfills

globals = require('rollup-plugin-node-globals');
polyfills = require('rollup-plugin-node-polyfills');

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
  install: ['hls.js', 'jsonld', 'three', 'webtorrent'],
  installOptions: {
    sourceMap: true,
    treeshake: true,
    rollup: {
      plugins: [globals(), polyfills()],
    },
  },
};
