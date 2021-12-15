const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, TOKEN_BLACKLIST } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  TOKEN: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
};

const MysqlSlvTokenBlacklist = new MysqlModel(connection, TOKEN_BLACKLIST, attributes);

module.exports = MysqlSlvTokenBlacklist;
