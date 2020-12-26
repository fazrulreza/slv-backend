const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, QUESTIONNAIRE } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  OPERATING_HISTORY: Sequelize.STRING,
  YEARLY_BUSINESS_PERFORMANCE: Sequelize.STRING,
  YEARLY_INDUSTRY_PERFORMANCE: Sequelize.STRING,
  PRODUCT_COUNT: Sequelize.STRING,
  PRODUCT_PERFORMANCE_2YEARS: Sequelize.STRING,
  PRODUCT_MARKET_LOCATION: Sequelize.STRING,
  PRODUCT_FEEDBACK_COLLECTION_FLAG: Sequelize.STRING,
  AVAILABLE_SYSTEM: Sequelize.STRING,
  MARKETING_TYPE: Sequelize.STRING,
  ONLINE_MARKETING_TYPE: Sequelize.STRING,
  OWNER_MANAGED_FLAG: Sequelize.STRING,
  ORGANIZATION_STRUCTURE_FLAG: Sequelize.STRING,
  EMPLOYEE_COUNT: Sequelize.STRING,
  FULLTIME_EMPLOYEE_COUNT: Sequelize.INTEGER,
  PARTTIME_EMPLOYEE_COUNT: Sequelize.INTEGER,
  BUSINESS_OWNER_INVOLVE_PERCENTAGE: Sequelize.STRING,
  EMPLOYEE_OJT_FLAG: Sequelize.STRING,
  EMPLOYEE_SOP_FLAG: Sequelize.STRING,
  EMPLOYEE_WRITTEN_CONTRACT_FLAG: Sequelize.STRING,
  EMPLOYEE_COUNT_2YEARS: Sequelize.STRING,
  EMPLOYEE_JD_KPI_FLAG: Sequelize.STRING,
  OPERATIONAL_GUIDELINE_FLAG: Sequelize.STRING,
  BUSINESS_PLAN_FLAG: Sequelize.STRING,
  BUSINESS_FUTURE_PLAN: Sequelize.STRING,
  SEEK_FINANCING_2YEARS_FLAG: Sequelize.STRING,
  SEEK_FINANCING_METHOD: Sequelize.STRING,
  CUSTOMER_PAYMENT_METHODS: Sequelize.STRING,
  LATE_PAYMENT_CUSTOMER: Sequelize.STRING,
  REGISTERED_BANK_ACCOUNT_FLAG: Sequelize.STRING,
  AUDIT_BUSINESS_ACCOUNT_FLAG: Sequelize.STRING,
  SST_FLAG: Sequelize.STRING,
  COMPANY_ID: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvQuestionnaire = new MysqlModel(connection, QUESTIONNAIRE, attributes);

module.exports = MysqlSlvQuestionnaire;
