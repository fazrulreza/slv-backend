const MysqlSlvCompanyProfile = require('./slv-company_profile');
const MysqlSlvSurvey = require('./slv-survey');
const MysqlSlvMSIC = require('./slv-msic');
const MysqlSlvAssessment = require('./slv-assessment');
const MysqlSlvSurveyHistory = require('./slv-survey_history');
const MysqlSlvAssessmentHistory = require('./slv-assessment_history');
const MysqlSlvUserRole = require('./slv-user_role');

const mysqlConnectors = {

  // common
  MysqlSlvCompanyProfile,
  MysqlSlvSurvey,
  MysqlSlvMSIC,
  MysqlSlvAssessment,
  MysqlSlvSurveyHistory,
  MysqlSlvAssessmentHistory,
  MysqlSlvUserRole,
};

module.exports = mysqlConnectors;
