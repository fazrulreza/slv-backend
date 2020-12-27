const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, MSIC } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  MSIC: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  description_malay_detail: Sequelize.STRING,
  section: Sequelize.STRING,
  division: Sequelize.STRING,
  group: Sequelize.STRING,
  Class: Sequelize.STRING,
  description_english_section: Sequelize.STRING,
  description_malay_section: Sequelize.STRING,
  description_english_division: Sequelize.STRING,
  description_malay_division: Sequelize.STRING,
  description_english_group: Sequelize.STRING,
  description_malay_group: Sequelize.STRING,
  description_english_class: Sequelize.STRING,
  description_malay_class: Sequelize.STRING,
  sector: Sequelize.STRING,
};

const MysqlSlvMSIC = new MysqlModel(connection, MSIC, attributes);

module.exports = MysqlSlvMSIC;
