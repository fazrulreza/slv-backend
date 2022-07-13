const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, MODULE } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  NAME: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  OWNER: Sequelize.STRING,
  STATUS: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvModule = new MysqlModel(connection, MODULE, attributes);

module.exports = MysqlSlvModule;
