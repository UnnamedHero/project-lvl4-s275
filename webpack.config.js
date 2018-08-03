const path = require('path');
const webpack = require('webpack');

const mode = process.env.NODE_ENV;

module.exports = {
  mode: mode === 'production' ? mode : 'development',
  entry: {
    app: ['./src/index.js'],
    vendor: ['jquery-ujs'],
  },
  output: {
    path: path.join(__dirname, 'dist', 'assets'),
    publicPath: '/assets/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    }),
  ],
};
