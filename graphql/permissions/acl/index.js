
const { createResolver } = require('apollo-resolvers');
const { isInstance } = require('apollo-errors');

const {
  UnknownError, ForbiddenError, AuthenticationRequiredError,
} = require('../errors');
const { canAccess } = require('./helper');

const baseResolver = createResolver(null, (root, args, context, error) => (
  isInstance(error)
    ? error
    : new UnknownError({
      message: `An unknown error has occurred! message: ${error}`,
    })));

const isAuthenticatedResolver = baseResolver.createResolver((root, args, { user }) => {
  if (!user) throw new AuthenticationRequiredError();
});

const userResolver = isAuthenticatedResolver.createResolver((root, args, { user }) => {
  if (!canAccess('user', user.userType)) throw new ForbiddenError();
});

// slv
const companyResolver = isAuthenticatedResolver.createResolver((root, args, { user }) => {
  if (!canAccess('company', user.userType)) throw new ForbiddenError();
});

const surveyResolver = isAuthenticatedResolver.createResolver((root, args, { user }) => {
  if (!canAccess('survey', user.userType)) throw new ForbiddenError();
});

const assessmentResolver = isAuthenticatedResolver.createResolver((root, args, { user }) => {
  if (!canAccess('assessment', user.userType)) throw new ForbiddenError();
});

const elsaResolver = isAuthenticatedResolver.createResolver((root, args, { user }) => {
  if (!canAccess('elsa', user.userType)) throw new ForbiddenError();
});

const companySurveyResolver = isAuthenticatedResolver.createResolver((root, args, { user }) => {
  if (!canAccess('company_survey', user.userType)) throw new ForbiddenError();
});

const surveyAssessmentResolver = isAuthenticatedResolver.createResolver((root, args, { user }) => {
  if (!canAccess('survey_assessment', user.userType)) throw new ForbiddenError();
});

const allSLVResolver = isAuthenticatedResolver.createResolver((root, args, { user }) => {
  if (!canAccess('all_SLV', user.userType)) throw new ForbiddenError();
});

module.exports = {
  userResolver,
  companyResolver,
  surveyResolver,
  assessmentResolver,
  elsaResolver,
  companySurveyResolver,
  surveyAssessmentResolver,
  allSLVResolver,
};
