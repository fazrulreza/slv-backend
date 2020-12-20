/** import path */
const path = require('path');
/** import merge-graphql-schema */
const { fileLoader, mergeTypes } = require('merge-graphql-schemas');

/** Configure type path for merging */
const typesArray = fileLoader(path.join(__dirname, '.'), { recursive: true });
module.exports = mergeTypes(typesArray);
