// The project lives on an exFAT drive, where macOS writes AppleDouble "._*" sidecar files
// next to every file. They are binary metadata, so Metro (and expo-router's route scan) must never see them.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const appleDouble = /(^|[/\\])\._[^/\\]*$/;
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  appleDouble,
];

module.exports = config;
