const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, USER_ROLE } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  USER: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  ROLE: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvUserRole = new MysqlModel(connection, USER_ROLE, attributes);

module.exports = MysqlSlvUserRole;
