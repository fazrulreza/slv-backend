const MysqlSlvCompanyProfile = require('./slv-company_profile');
const MysqlSlvQuestionnaire = require('./slv-questionnaire');
const MysqlSlvMSIC = require('./slv-msic');

const mysqlConnectors = {

  // common
  MysqlSlvCompanyProfile,
  MysqlSlvQuestionnaire,
  MysqlSlvMSIC,
};

module.exports = mysqlConnectors;
