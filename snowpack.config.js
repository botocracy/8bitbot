// Plugin: https://github.com/ionic-team/rollup-plugin-node-polyfills

globals = require('rollup-plugin-node-globals');
polyfills = require('rollup-plugin-node-polyfills');
const ThreadsPlugin = require('threads-plugin');

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
        extendConfig: (config) => {
          config.plugins.push(new ThreadsPlugin());
          return config;
        },
      },
    ],
  ],
  devOptions: {
    bundle: false,
  },
  install: ['hls.js', 'jsonld', 'three'],
  installOptions: {
    sourceMap: true,
    treeshake: true,
    rollup: {
      plugins: [globals(), polyfills()],
    },
  },
};
