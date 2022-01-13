const { createResolver } = require('apollo-resolvers');
const { isInstance } = require('apollo-errors');

const {
  UnknownError, AuthenticationRequiredError, SessionExpiredError, JsonWebTokenError,
} = require('../errors');
const logger = require('../../../packages/logger');

const baseResolver = createResolver(null, (root, args, context, error) => (
  isInstance(error)
    ? error
    : new UnknownError({
      message: `An unknown error has occurred! message: ${error}`,
    })));

const isAuthenticatedResolver = baseResolver.createResolver((root, args, { user }) => {
  if (!user) {
    logger.error('authentication --> invalid user');
    throw new AuthenticationRequiredError();
  }
  if (user.name === 'TokenExpiredError') {
    logger.error(`authentication --> ${user.name}`);
    throw new SessionExpiredError();
  }
  if (user.name === 'JsonWebTokenError') {
    logger.error(`authentication --> ${user.name}`);
    throw new JsonWebTokenError({ message: user.message });
  }
});

module.exports = {
  isAuthenticatedResolver,
};
