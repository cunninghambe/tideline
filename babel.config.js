module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      ['inline-import', { extensions: ['.sql'] }],
      // react-native-worklets must be last per NativeWind v4 + RN 0.81 docs
      'react-native-worklets/plugin',
    ],
  };
};
