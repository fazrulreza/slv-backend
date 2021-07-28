const MysqlSlvCompanyProfile = require('./slv-company_profile');
const MysqlSlvSurvey = require('./slv-survey');
const MysqlSlvMSIC = require('./slv-msic');
const MysqlSlvAssessment = require('./slv-assessment');
const MysqlSlvUserRole = require('./slv-user_role');
const MysqlSlvELSAScorecard = require('./slv-elsa_scorecard');
const MysqlGetxKPI = require('./getx-kpi');
const MysqlGetxSign = require('./getx-sign');
const MysqlGetxAttachment = require('./getx-attachment');
const MysqlSlvPrediction = require('./slv-prediction');

const mysqlConnectors = {
  MysqlSlvCompanyProfile,
  MysqlSlvSurvey,
  MysqlSlvPrediction,
  MysqlSlvMSIC,
  MysqlSlvAssessment,
  MysqlSlvUserRole,
  MysqlSlvELSAScorecard,

  // getx
  MysqlGetxKPI,
  MysqlGetxSign,
  MysqlGetxAttachment,
};

module.exports = mysqlConnectors;
