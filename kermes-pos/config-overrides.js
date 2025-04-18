module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "util": require.resolve("util/"),
    "path": require.resolve("path-browserify"),
    "stream": require.resolve("stream-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "buffer": require.resolve("buffer/"),
  };
  return config;
} 