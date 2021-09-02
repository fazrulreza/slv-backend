const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, USER } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  USER: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  ROLE: Sequelize.INTEGER,
  STATUS: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvUser = new MysqlModel(connection, USER, attributes);

module.exports = MysqlSlvUser;
