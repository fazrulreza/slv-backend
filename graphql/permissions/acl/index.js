const { createResolver } = require('apollo-resolvers');
const { isInstance } = require('apollo-errors');

const { UnknownError, AuthenticationRequiredError } = require('../errors');

const baseResolver = createResolver(null, (root, args, context, error) => (
  isInstance(error)
    ? error
    : new UnknownError({
      message: `An unknown error has occurred! message: ${error}`,
    })));

const isAuthenticatedResolver = baseResolver.createResolver((root, args, { user }) => {
  if (!user) throw new AuthenticationRequiredError();
});

module.exports = {
  isAuthenticatedResolver,
};
