const { createError } = require('apollo-errors');

// ------------------
// Common Errors
const UnknownError = createError('UnknownError', {
  message: 'An unknown error has occurred!  Please try again later',
});

const NotFoundError = createError('NotFoundError', {
  message: 'No record found',
});

const NetworkError = createError('NetworkError', {
  message: 'Something is wrong with the network. Please try again later',
});

const WrongPasswordError = createError('WrongPasswordError', {
  message: 'Wrong password',
});

const UserExistsError = createError('UserExistsError', {
  message: 'Email already exists',
});

const GroupExistsError = createError('GroupExistsError', {
  message: 'Group already exists',
});

const UsernameError = createError('UsernameError', {
  message: 'Wrong username input',
});

const passwordStrengthError = createError('passwordStrengthError', {
  message: 'Password is too weak!',
});

const UserLoginExistsError = createError('UserLoginExistsError', {
  message: 'User Login already exists',
});

const CompanyExistsError = createError('CompanyExistsError', {
  message: 'Company already exists',
});

const DataTooLongError = createError('DataTooLongError', {
  message: 'Company name too long',
});

const InvalidDataError = createError('InvalidDataError', {
  message: 'Invalid Data',
});

const DataNotAnArrayError = createError('DataNotAnArrayError', {
  message: 'Data is not an Array',
});

const SurveyExistsError = createError('SurveyExistsError', {
  message: 'Current survey for company already exists',
});

const AssessmentExistsError = createError('AssessmentExistsError', {
  message: 'Current assessment for company already exists',
});

const NoSurveyError = createError('NoSurveyError', {
  message: 'No survey found',
});

const NoAssessmentError = createError('NoAssessmentError', {
  message: 'No assessment found',
});

const LargeEnterpriseError = createError('LargeEnterpriseError', {
  message: 'ELSA cannot be calculated for company with SME size of LARGE ENTERPRISE',
});

// ------------------

// ------------------
// ACL Errors
const ForbiddenError = createError('ForbiddenError', {
  message: 'You are not allowed to do this',
});

const AuthenticationRequiredError = createError('AuthenticationRequiredError', {
  message: 'You must be logged in to do this',
});

const SessionExpiredError = createError('SessionExpiredError', {
  message: 'Your session has expired, kindly log in again',
});

const JsonWebTokenError = createError('JsonWebTokenError', {
  message: 'JsonWebTokenError',
});

const NotYourUserError = createError('NotYourUserError', {
  message: 'You cannot update the profile for other users',
});

const NotEnoughCreditError = createError('notEnoughCreditError', {
  message: 'You do not have enough credit to do this',
});
// ------------------

module.exports = {
  UnknownError,
  NotFoundError,
  WrongPasswordError,
  UserExistsError,
  GroupExistsError,
  UsernameError,
  passwordStrengthError,
  UserLoginExistsError,
  ForbiddenError,
  AuthenticationRequiredError,
  NotYourUserError,
  NotEnoughCreditError,
  SessionExpiredError,
  JsonWebTokenError,
  CompanyExistsError,
  DataTooLongError,
  LargeEnterpriseError,
  InvalidDataError,
  DataNotAnArrayError,
  SurveyExistsError,
  AssessmentExistsError,
  NoSurveyError,
  NoAssessmentError,
  NetworkError,
};
