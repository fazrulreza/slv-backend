const MysqlSlvCompanyProfile = require('./slv-company_profile');
const MysqlSlvSurvey = require('./slv-survey');
const MysqlSlvMSIC = require('./slv-msic');
const MysqlSlvAssessment = require('./slv-assessment');
const MysqlSlvUserRole = require('./slv-user_role');
const MysqlSlvELSAScorecard = require('./slv-elsa_scorecard');
const MysqlGetxKPI = require('./getx-kpi');
const MysqlGetxSign = require('./getx-sign');

const mysqlConnectors = {
  MysqlSlvCompanyProfile,
  MysqlSlvSurvey,
  MysqlSlvMSIC,
  MysqlSlvAssessment,
  MysqlSlvUserRole,
  MysqlSlvELSAScorecard,

  // getx
  MysqlGetxKPI,
  MysqlGetxSign,
};

module.exports = mysqlConnectors;
