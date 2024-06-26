const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, COMPANY_PROFILE } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  LOGO: Sequelize.STRING,
  ENTITY_NAME: Sequelize.STRING,
  ENTRY_DATE: Sequelize.STRING,
  REGISTRATION_NO: Sequelize.STRING,
  NEW_REGISTRATION_NO: Sequelize.STRING,
  INCORPORATION_DATE: Sequelize.STRING,
  BUMI_STATUS: Sequelize.STRING,
  WOMAN_OWNED: Sequelize.STRING,
  GETX_FLAG: Sequelize.STRING,
  ENTITY_STATUS: Sequelize.STRING,
  ENTITY_TYPE: Sequelize.STRING,
  ADDRESS_LINE_1: Sequelize.STRING,
  ADDRESS_LINE_2: Sequelize.STRING,
  POSTCODE: Sequelize.STRING,
  STATE: Sequelize.STRING,
  PHONE: Sequelize.STRING,
  EMAIL: Sequelize.STRING,
  FIN_AGENCY_1: Sequelize.STRING,
  FIN_AGENCY_2: Sequelize.STRING,
  FIN_AGENCY_3: Sequelize.STRING,
  NATURE_OF_BUSINESS: Sequelize.STRING,
  SECTOR: Sequelize.STRING,
  DIVISION: Sequelize.STRING,
  SECTION: Sequelize.STRING,
  GROUP: Sequelize.STRING,
  CLASS: Sequelize.STRING,
  MSIC: Sequelize.STRING,
  MODULE: Sequelize.STRING,
  OWNER: Sequelize.STRING,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvCompanyProfile = new MysqlModel(connection, COMPANY_PROFILE, attributes);

module.exports = MysqlSlvCompanyProfile;
