const path = require('path');

const mode = process.env.NODE_ENV;

module.exports = {
  mode: mode === 'production' ? mode : 'development',
  entry: ['./src/index.js'],
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
    // new webpack.ProvidePlugin({
    //   $: 'jquery',
    //   jQuery: 'jquery',
    //   'window.jQuery': 'jquery',
    //   Popper: ['popper.js', 'default'],
    // }),
  ],
};
