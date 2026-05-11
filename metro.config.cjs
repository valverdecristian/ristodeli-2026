const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Configuración básica sin NativeWind por ahora
module.exports = defaultConfig;
