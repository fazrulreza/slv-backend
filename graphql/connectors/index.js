/** Import mysql connectors */
const mysqlConnectors = require('./mysql');
// /** Import elasticsearch connectors */
// const esConnectors = require('./elasticsearch');

/**
 * Combine all connectors
 * Note: Adding connectors from other source e.g. mysql is possible
 */
const connectors = {
  ...mysqlConnectors,
  // ...esConnectors,
};

module.exports = connectors;
