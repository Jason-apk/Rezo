// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permet à Metro de bundler les fichiers .txt (GTFS) comme des assets
config.resolver.assetExts.push("txt");

module.exports = config;
