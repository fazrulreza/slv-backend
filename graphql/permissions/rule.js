// company
const oneCompanyRule = ['COMPANY-READ', 'MODULE-READ'];
const allCompaniesRule = ['COMPANY-READ', 'SURVEY-READ', 'ASSESSMENT-READ', 'GETX-READ'];
const userReportsRule = ['USER-READ', 'ROLES-READ', 'COMPANY-READ', 'SURVEY-READ', 'ASSESSMENT-READ'];
const stateReportsRule = ['COMPANY-READ', 'SURVEY-READ', 'ASSESSMENT-READ'];
const checkCompanyRule = ['COMPANY-READ'];
const createCompanyRule = ['COMPANY-CREATE'];
const deleteCompanyRule = ['COMPANY-DELETE'];
const updateCompanyRule = ['COMPANY-UPDATE'];
const unlistCompanyRule = ['GETX-DELETE'];

// getx kpi
const dashboardKPIRule = ['GETX-READ', 'USER-READ'];
const scorecardKPIRule = ['COMPANY-READ', 'GETX-READ'];
const allGetXKPIRule = ['ELSA-READ', 'GETX-READ', 'SURVEY-READ', 'ASSESSMENT-READ'];
const createGetXKPIRule = ['GETX-CREATE'];
const updateGetXKPIRule = ['GETX-UPDATE'];
const finalizeKPIRule = ['GETX-CREATE', 'SURVEY-READ'];

// getx coach log
const allGetXCoachLogRule = ['COMPANY-READ', 'GETX-READ', 'SURVEY-READ', 'ASSESSMENT-READ'];
const updateGetXCoachRule = ['GETX-CREATE', 'GETX-UPDATE'];

// assessment
const allAssessmentRule = ['ASSESSMENT-READ', 'SURVEY-READ'];
const createAssessmentRule = ['ASSESSMENT-CREATE'];
const updateAssessmentRule = ['ASSESSMENT-UPDATE'];

// elsa
const fullElsaListRule = ['COMPANY-READ', 'SURVEY-READ', 'ELSA-READ'];
const elsaPriorityRule = ['COMPANY-READ', 'SURVEY-READ', 'ELSA-READ', 'ASSESSMENT-READ'];
const oneElsaRule = ['SURVEY-READ', 'ELSA-READ', 'ASSESSMENT-READ'];
const oneAllRule = ['COMPANY-READ', 'SURVEY-READ', 'ELSA-READ', 'ELSA-CREATE', 'ASSESSMENT-READ'];
const createElsaRule = ['SURVEY-CREATE', 'ELSA-CREATE', 'ASSESSMENT-CREATE'];

// moduls
const allModulsRule = ['MODULE-READ'];
const createModulRule = ['MODULE-CREATE'];
const updateModulRule = ['MODULE-UPDATE'];
const deleteModulRule = ['MODULE-DELETE'];

// survey
const allSurveyRule = ['COMPANY-READ', 'SURVEY-READ'];
const smeScatterRule = ['COMPANY-READ', 'SURVEY-READ', 'ASSESSMENT-READ'];
const surveyFieldRule = ['COMPANY-READ', 'SURVEY-READ', 'ASSESSMENT-READ'];
const createSurveyRule = ['SURVEY-CREATE', 'USER-UPDATE'];
const updateSurveyRule = ['SURVEY-UPDATE'];

// user
const allUserRule = ['USER-READ', 'ROLES-READ'];
const createUserRule = ['USER-CREATE'];
const updateUserRule = ['USER-UPDATE'];
const deleteUserRule = ['USER-DELETE'];

// user public
const allUserPublicRule = ['USER-READ', 'ROLES-READ'];
const oneUserPublicRule = ['USER-READ', 'ROLES-READ'];
const createUserPublicRule = ['USER-CREATE'];
const updateUserPublicRule = ['USER-UPDATE'];
const deleteUserPublicRule = ['USER-DELETE'];

// user role
const allUserRoleRule = ['ROLES-READ', 'MODULE-READ'];
const oneUserRoleRule = ['ROLES-READ', 'MODULE-READ'];
const createUserRoleRule = ['ROLES-CREATE'];
const updateUserRoleRule = ['ROLES-UPDATE'];
const deleteUserRoleRule = ['ROLES-DELETE'];

module.exports = {
  // company
  oneCompanyRule,
  allCompaniesRule,
  userReportsRule,
  stateReportsRule,
  checkCompanyRule,
  createCompanyRule,
  deleteCompanyRule,
  updateCompanyRule,
  unlistCompanyRule,
  // getx kpi
  dashboardKPIRule,
  scorecardKPIRule,
  allGetXKPIRule,
  createGetXKPIRule,
  updateGetXKPIRule,
  finalizeKPIRule,
  // getx coach log
  allGetXCoachLogRule,
  updateGetXCoachRule,
  // assessment
  allAssessmentRule,
  createAssessmentRule,
  updateAssessmentRule,
  // elsa
  fullElsaListRule,
  elsaPriorityRule,
  oneElsaRule,
  oneAllRule,
  createElsaRule,
  // moduls
  allModulsRule,
  createModulRule,
  updateModulRule,
  deleteModulRule,
  // survey
  allSurveyRule,
  smeScatterRule,
  surveyFieldRule,
  createSurveyRule,
  updateSurveyRule,
  // user
  allUserRule,
  createUserRule,
  updateUserRule,
  deleteUserRule,
  // user public
  allUserPublicRule,
  oneUserPublicRule,
  createUserPublicRule,
  updateUserPublicRule,
  deleteUserPublicRule,
  // user role
  allUserRoleRule,
  oneUserRoleRule,
  createUserRoleRule,
  updateUserRoleRule,
  deleteUserRoleRule,
};
