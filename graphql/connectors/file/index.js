const FileSlvCompanyProfile = require('./slv-company_profile');
const FileSlvMSIC = require('./slv-msic');
const FileSlvSurvey = require('./slv-survey');
const FileSlvAssessment = require('./slv-assessment');
const FileSlvELSAScorecard = require('./slv-elsa_scorecard');
const FileGetxKPI = require('./getx-kpi');
const FileSlvPrediction = require('./slv-prediction');
const FileSlvUserRole = require('./slv-user_role');

const fileConnectors = {
  // elsa
  FileSlvCompanyProfile,
  FileSlvMSIC,
  FileSlvSurvey,
  FileSlvAssessment,
  FileSlvELSAScorecard,
  FileSlvPrediction,
  FileSlvUserRole,

  // user

  // getx
  FileGetxKPI,
};

module.exports = fileConnectors;
