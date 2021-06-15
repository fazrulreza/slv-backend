const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, GETX_SIGN } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  GETX_ID: Sequelize.STRING,
  GETX_TYPE: Sequelize.STRING,
  BUS_OWNER_NAME: Sequelize.STRING,
  BUS_OWNER_DATE: Sequelize.STRING,
  BUS_OWNER: Sequelize.STRING,
  BUS_COACH_NAME: Sequelize.STRING,
  BUS_COACH_DATE: Sequelize.STRING,
  BUS_COACH: Sequelize.STRING,
  CHECKER_NAME: Sequelize.STRING,
  CHECKER_DATE: Sequelize.STRING,
  CHECKER: Sequelize.STRING,
  COMPANY_ID: Sequelize.STRING,
  ASSESSMENT_YEAR: Sequelize.INTEGER.UNSIGNED,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlGetxSign = new MysqlModel(connection, GETX_SIGN, attributes);

module.exports = MysqlGetxSign;
