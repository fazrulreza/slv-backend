const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, USER_ROLE } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    primaryKey: true,
    type: Sequelize.INTEGER,
  },
  NAME: Sequelize.STRING,
  MODULE: Sequelize.STRING,
  STATUS: Sequelize.STRING,
  DATA_VIEW: Sequelize.STRING,
  USER_MODULE: Sequelize.STRING,
  COMPANY_MODULE: Sequelize.STRING,
  SURVEY_MODULE: Sequelize.STRING,
  ASSESSMENT_MODULE: Sequelize.STRING,
  GETX_MODULE: Sequelize.STRING,
  ROLES_MODULE: Sequelize.STRING,
  ELSA_MODULE: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvUserRole = new MysqlModel(connection, USER_ROLE, attributes);

module.exports = MysqlSlvUserRole;
