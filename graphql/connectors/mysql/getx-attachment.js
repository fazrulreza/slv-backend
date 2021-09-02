const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, GETX_ATTACHMENT } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  GETX_ID: Sequelize.STRING,
  GETX_TYPE: Sequelize.STRING,
  TURNOVER_ATTACHMENT: Sequelize.STRING,
  PROFITABILITY_ATTACHMENT: Sequelize.STRING,
  SKILLED_ATTACHMENT: Sequelize.STRING,
  UNSKILLED_ATTACHMENT: Sequelize.STRING,
  EXPORT_REVENUE_ATTACHMENT: Sequelize.STRING,
  DIVERSIFY_ATTACHMENT: Sequelize.STRING,
  TECHNOLOGY_ATTACHMENT: Sequelize.STRING,
  NG_ATTACHMENT: Sequelize.STRING,
  FILE_ATTACHMENT: Sequelize.STRING,
  COMPANY_ID: Sequelize.STRING,
  MODULE: Sequelize.STRING,
  ASSESSMENT_YEAR: Sequelize.INTEGER.UNSIGNED,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlGetxAttachment = new MysqlModel(connection, GETX_ATTACHMENT, attributes);

module.exports = MysqlGetxAttachment;
