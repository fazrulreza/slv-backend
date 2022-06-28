const { createResolver } = require('apollo-resolvers');
const { isInstance } = require('apollo-errors');

const {
  UnknownError, AuthenticationRequiredError, SessionExpiredError, JsonWebTokenError,
} = require('../errors');
const logger = require('../../../packages/logger');

/**
 * Base permission resolver
 */
const baseResolver = createResolver(null, (root, args, context, error) => (
  isInstance(error)
    ? error
    : new UnknownError({
      message: `An unknown error has occurred! message: ${error}`,
    })));

/**
 * Authentication resolver
 */
const isAuthenticatedResolver = baseResolver.createResolver((root, args, { user }) => {
  if (!user) {
    logger.error('authentication --> invalid user');
    throw new AuthenticationRequiredError();
  }
  if (user.username === 'TokenExpiredError') {
    logger.error(`authentication --> ${user.username}`);
    throw new SessionExpiredError();
  }
  if (user.username === 'JsonWebTokenError') {
    logger.error(`authentication --> ${user.username}`);
    throw new JsonWebTokenError({ message: user.message });
  }
});

module.exports = {
  isAuthenticatedResolver,
};
