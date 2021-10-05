const { createResolver } = require('apollo-resolvers');
const { isInstance } = require('apollo-errors');

const {
  UnknownError, AuthenticationRequiredError, SessionExpiredError, JsonWebTokenError,
} = require('../errors');

const baseResolver = createResolver(null, (root, args, context, error) => (
  isInstance(error)
    ? error
    : new UnknownError({
      message: `An unknown error has occurred! message: ${error}`,
    })));

const isAuthenticatedResolver = baseResolver.createResolver((root, args, { user }) => {
  if (!user) throw new AuthenticationRequiredError();
  if (user.name === 'TokenExpiredError') throw new SessionExpiredError();
  if (user.name === 'JsonWebTokenError') throw new JsonWebTokenError({ message: user.message });
});

module.exports = {
  isAuthenticatedResolver,
};
