const path = require('path');

module.exports = {
  // Options for resolving module requests
  resolve: {
    // extensions that are used
    //extensions: [".js", ".json", ".jsx", ".css"],
    // a list of module name aliases
    alias: {
      '@app': path.resolve(__dirname, 'src/'),
    },

    crypto: false,
  },

  // Enhance debugging by adding meta info for the browser devtools
  // source-map most detailed at the expense of build speed
  devtool: 'source-map', // enum

  // The home directory for webpack (absolute path!). The entry an
  // module.rules.loader option is resolved relative to this directory.
  context: __dirname,

  // The environment in which the bundle should run. Changes chunk loading
  // behavior and available modules
  target: 'web',

  node: {
    global: true,
    Buffer: false,
    crypto: false,
  },

  externals: {
    crypto: 'crypto',
    fs: 'fs',
    Buffer: 'Buffer',
  },
};
