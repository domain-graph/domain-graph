const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  target: 'web',
  mode: 'production',
  entry: './src/umd/umd.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'less-loader',
            options: { additionalData: "@import '/src/colors.less';" },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'umd'),
    filename: 'domain-graph.min.js',
    library: { name: 'domainGraph', type: 'umd' },
  },
  plugins: [new MiniCssExtractPlugin({ filename: 'domain-graph.min.css' })],
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
};
