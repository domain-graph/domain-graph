const path = require('path');

const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })],
  output: {
    filename: '[name].[contenthash].js',
  },
});
