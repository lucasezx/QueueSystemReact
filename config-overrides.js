module.exports = function override(config, env) {
  config.resolve.fallback = {
    assert: require.resolve('assert/'),
    readline: require.resolve('readline/'),
    url: require.resolve('url/'),
    path: require.resolve('path-browserify'),
    fs: require.resolve('browserify-fs'),
    util: require.resolve('util/'),
    buffer: require.resolve('buffer/'),
    stream: require.resolve('stream-browserify'),
  };

  return config;
};