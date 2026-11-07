// The panchang engine lives in ../js and is shared with the web PWA, so Metro must watch it.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../js')];

module.exports = config;
