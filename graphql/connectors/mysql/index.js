const MysqlSlvCompanyProfile = require('./slv-company_profile');
const MysqlSlvSurvey = require('./slv-survey');
const MysqlSlvMSIC = require('./slv-msic');
const MysqlSlvAssessment = require('./slv-assessment');
const MysqlSlvUser = require('./slv-user');
const MysqlSlvELSAScorecard = require('./slv-elsa_scorecard');
const MysqlSlvELSAWeightage = require('./slv-elsa_weightage');
const MysqlGetxKPI = require('./getx-kpi');
const MysqlGetxSign = require('./getx-sign');
const MysqlGetxAttachment = require('./getx-attachment');
const MysqlSlvPrediction = require('./slv-prediction');
const MysqlSlvUserRole = require('./slv-user_role');
const MysqlSlvUserPublic = require('./slv-user_public');
const MysqlSlvTokenBlacklist = require('./slv-token_blacklist');

const mysqlConnectors = {
  // elsa
  MysqlSlvCompanyProfile,
  MysqlSlvSurvey,
  MysqlSlvPrediction,
  MysqlSlvMSIC,
  MysqlSlvAssessment,
  MysqlSlvELSAScorecard,
  MysqlSlvELSAWeightage,

  // user
  MysqlSlvUser,
  MysqlSlvUserRole,
  MysqlSlvUserPublic,
  MysqlSlvTokenBlacklist,

  // getx
  MysqlGetxKPI,
  MysqlGetxSign,
  MysqlGetxAttachment,
};

module.exports = mysqlConnectors;
