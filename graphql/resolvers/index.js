/** import path */
const { join } = require('path');
/** import merge-graphql-schema */
const { fileLoader, mergeResolvers } = require('merge-graphql-schemas');

/** Configure resolvers path for merging */
const resolversArray = fileLoader(join(__dirname, '.'), { recursive: true });
module.exports = mergeResolvers(resolversArray);
