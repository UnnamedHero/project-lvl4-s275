// TODO: move to babel.config
import path from 'path';
import webpack from 'webpack';
import rimraf from 'rimraf';

const mode = process.env.NODE_ENV;

export default {
  mode: mode === 'production' ? mode : 'development',
  entry: {
    vendor: ['jquery-ujs', 'bootstrap'],
    app: ['./src/client/index.js'],
  },
  output: {
    path: path.join(__dirname, 'public', 'assets'),
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
    {
      apply: (compiler) => {
        rimraf.sync(compiler.options.output.path);
      },
    },
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    }),
  ],
};
