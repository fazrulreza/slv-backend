const MysqlSlvCompanyProfile = require('./slv-company_profile');
const MysqlSlvQuestionnaire = require('./slv-questionnaire');
const MysqlSlvMSIC = require('./slv-msic');
const MysqlSlvScoring = require('./slv-scoring');

const mysqlConnectors = {

  // common
  MysqlSlvCompanyProfile,
  MysqlSlvQuestionnaire,
  MysqlSlvMSIC,
  MysqlSlvScoring,
};

module.exports = mysqlConnectors;
