module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { nativewind: { web: true } }],
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};
