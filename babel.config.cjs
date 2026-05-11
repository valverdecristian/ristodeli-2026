module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // Plugin para las variables de entorno (.env)
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    // Plugin para los alias (lo que ya tenías)
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@core': './src/core',
          '@shared': './src/shared',
          '@features': './src/features',
          '@navigation': './src/navigation',
          '@assets': './src/assets',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};