const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
const metroConfig = withNativeWind(config, { input: './global.css' });
module.exports = metroConfig;