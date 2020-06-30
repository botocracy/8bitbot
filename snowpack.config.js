// Plugin: https://github.com/ionic-team/rollup-plugin-node-polyfills

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
  install: ['hls.js'],
  installOptions: {
    sourceMap: true,
    treeshake: true,
    rollup: {
      plugins: [polyfills()],
    },
  },
};
