const ExtractTextPlugin = require('extract-text-webpack-plugin'),
  ManifestPlugin = require('webpack-manifest-plugin'),
  webpack = require('webpack'),

  dev = {
    css: '[name].css',
    js: '[name].js',
    plugins: [],
    styleLoader: 'style-loader!css-loader!autoprefixer-loader?browsers=last 2 versions!sass-loader'
  },
  prod = {
    css: '[name].[hash].css',
    js: '[name].[hash].js',
    plugins: [
      new ExtractTextPlugin('[name].[hash].css'),
      new webpack.ProvidePlugin({
        'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
      }),
      new ManifestPlugin({})
    ],
    styleLoader: ExtractTextPlugin.extract('style-loader', 'css-loader!autoprefixer-loader?browsers=last 2 versions!sass-loader'),
  },
  opts = process.env.NODE_ENV === 'production' ? prod : dev;

module.exports = {
  entry: './app.jsx',
  output: {
    path: './dist/',
    filename: opts.js
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel'
    }, {
      test: /\.scss$/,
      loader: opts.styleLoader
    }]
  },
  plugins: opts.plugins,
  devtool: 'source-map'
};
