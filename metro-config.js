const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude functions folder
config.resolver.blockList = [
  /functions\/.*/,
];

module.exports = config;
