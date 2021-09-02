const MysqlSlvCompanyProfile = require('./slv-company_profile');
const MysqlSlvSurvey = require('./slv-survey');
const MysqlSlvMSIC = require('./slv-msic');
const MysqlSlvAssessment = require('./slv-assessment');
const MysqlSlvUser = require('./slv-user');
const MysqlSlvELSAScorecard = require('./slv-elsa_scorecard');
const MysqlGetxKPI = require('./getx-kpi');
const MysqlGetxSign = require('./getx-sign');
const MysqlGetxAttachment = require('./getx-attachment');
const MysqlSlvPrediction = require('./slv-prediction');
const MysqlSlvUserRole = require('./slv-user_role');

const mysqlConnectors = {
  // elsa
  MysqlSlvCompanyProfile,
  MysqlSlvSurvey,
  MysqlSlvPrediction,
  MysqlSlvMSIC,
  MysqlSlvAssessment,
  MysqlSlvELSAScorecard,

  // user
  MysqlSlvUser,
  MysqlSlvUserRole,

  // getx
  MysqlGetxKPI,
  MysqlGetxSign,
  MysqlGetxAttachment,
};

module.exports = mysqlConnectors;
