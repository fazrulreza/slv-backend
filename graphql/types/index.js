/** import path */
const path = require('path');
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { loadFilesSync } = require('@graphql-tools/load-files');

/** Configure type path for merging */
const typesArray = loadFilesSync(path.join(__dirname, '.'), { recursive: true, ignoreIndex: true });
module.exports = mergeTypeDefs(typesArray);
