var path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'public/src/index-image.js'),
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    libraryTarget: 'var',
    library: 'Entrypoint'
  }
};
