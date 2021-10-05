const { createError } = require('apollo-errors');

// ------------------
// Common Errors
const UnknownError = createError('UnknownError', {
  message: 'An unknown error has occurred!  Please try again later',
});

const NotFoundError = createError('NotFoundError', {
  message: 'No record found with the supplied args',
});

const WrongPasswordError = createError('WrongPasswordError', {
  message: 'Wrong password was specified',
});

const UserExistsError = createError('UserExistsError', {
  message: 'Username already exists',
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
};
