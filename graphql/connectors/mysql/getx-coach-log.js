const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, GETX_COACH_LOG } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  GETX_ID: Sequelize.STRING,
  VENUE: Sequelize.STRING,
  COACHING_SESSION: Sequelize.INTEGER.UNSIGNED,
  START_COACH: Sequelize.STRING,
  END_COACH: Sequelize.STRING,
  TURNOVER_GAP: Sequelize.STRING,
  PROFITABILITY_GAP: Sequelize.STRING,
  SKILLED_GAP: Sequelize.STRING,
  UNSKILLED_GAP: Sequelize.STRING,
  EXPORT_REVENUE_GAP: Sequelize.STRING,
  DIVERSIFY_GAP: Sequelize.STRING,
  TECHNOLOGY_GAP: Sequelize.STRING,
  NG_GAP: Sequelize.STRING,
  CLIENT_ISSUES: Sequelize.STRING,
  CLIENT_EXPECTATION: Sequelize.STRING,
  ACTION_PLANS: Sequelize.STRING,
  FURTHER_NOTES_COACHING: Sequelize.STRING,
  COMPANY_ID: Sequelize.STRING,
  MODULE: Sequelize.STRING,
  QUARTER: Sequelize.INTEGER.UNSIGNED,
  ASSESSMENT_YEAR: Sequelize.INTEGER.UNSIGNED,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlGetxCoachLog = new MysqlModel(connection, GETX_COACH_LOG, attributes);

module.exports = MysqlGetxCoachLog;
