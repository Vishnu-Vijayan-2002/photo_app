const { getDefaultConfig, mergeConfig } = require('metro-config');

const defaultConfig = getDefaultConfig.getDefaultValues(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  serializer: {
    getPolyfills: () => require('@react-native/js-polyfills')(),
  },
};

module.exports = mergeConfig(defaultConfig, config);
