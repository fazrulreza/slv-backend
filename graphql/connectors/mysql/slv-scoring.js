const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, SCORING } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  OH_OPERATING_HISTORY: Sequelize.INTEGER,
  OH_OPERATING_HISTORY_COMMENT: Sequelize.STRING,
  IG_INDUSTRY_POTENTIAL: Sequelize.INTEGER,
  IG_INDUSTRY_POTENTIAL_COMMENT: Sequelize.STRING,
  BR_PRODUCT_LINE: Sequelize.INTEGER,
  BR_PRODUCT_LINE_COMMENT: Sequelize.STRING,
  BR_PRODUCT_QUALITY: Sequelize.INTEGER,
  BR_PRODUCT_QUALITY_COMMENT: Sequelize.STRING,
  BR_TECHNOLOGY: Sequelize.INTEGER,
  BR_TECHNOLOGY_COMMENT: Sequelize.STRING,
  BR_DEVELOPMENT_CAPACITY: Sequelize.INTEGER,
  BR_DEVELOPMENT_CAPACITY_COMMENT: Sequelize.STRING,
  LC_ORGANIZATION: Sequelize.INTEGER,
  LC_ORGANIZATION_COMMENT: Sequelize.STRING,
  LC_PLANNING: Sequelize.INTEGER,
  LC_PLANNING_COMMENT: Sequelize.STRING,
  PR_STAFFING: Sequelize.INTEGER,
  PR_STAFFING_COMMENT: Sequelize.STRING,
  PR_STAFF_PERFORMANCE: Sequelize.INTEGER,
  PR_STAFF_PERFORMANCE_COMMENT: Sequelize.STRING,
  SR_EXECUTION_CAPACITY: Sequelize.INTEGER,
  SR_EXECUTION_CAPACITY_COMMENT: Sequelize.STRING,
  SR_BUDGETTING: Sequelize.INTEGER,
  SR_BUDGETTING_COMMENT: Sequelize.STRING,
  FR_FINANCE: Sequelize.INTEGER,
  FR_FINANCE_COMMENT: Sequelize.STRING,
  FR_FINANCIAL_SYSTEM: Sequelize.INTEGER,
  FR_FINANCIAL_SYSTEM_COMMENT: Sequelize.STRING,
  COMPANY_ID: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvScoring = new MysqlModel(connection, SCORING, attributes);

module.exports = MysqlSlvScoring;
