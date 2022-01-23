const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, USER_PUBLIC } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  NAME: Sequelize.STRING,
  EMAIL: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  SOURCE: Sequelize.STRING,
  AVATAR: Sequelize.STRING,
  ROLE: Sequelize.INTEGER,
  STATUS: Sequelize.STRING,
  PHONE: Sequelize.STRING,
  GENDER: Sequelize.STRING,
  DOB: Sequelize.STRING,
  PWD: Sequelize.STRING,
  OPT_FOR_MARKETING: Sequelize.STRING,
  COMPANY_ID: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvUserPublic = new MysqlModel(connection, USER_PUBLIC, attributes);

module.exports = MysqlSlvUserPublic;
