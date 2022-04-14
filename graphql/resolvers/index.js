/** import path */
const { join } = require('path');
const { mergeResolvers } = require('@graphql-tools/merge');
const { loadFilesSync } = require('@graphql-tools/load-files');

/** Configure resolvers path for merging */
const resolversArray = loadFilesSync(join(__dirname, '.'), { recursive: true, ignoreIndex: true });
module.exports = mergeResolvers(resolversArray);
