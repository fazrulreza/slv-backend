const express = require('express');
const fs = require('fs');
const https = require('https');
const { ApolloServer } = require('apollo-server-express');
/** import apollo-errors */
const { formatError } = require('apollo-errors');
/** import GraphQL resolvers */
const resolvers = require('./graphql/resolvers');
/** import GraphQL types */
const typeDefs = require('./graphql/types');
/** import connectors */
const connectors = require('./graphql/connectors');
const { verifyToken } = require('./graphql/helper/common');
const { ForbiddenError } = require('./graphql/permissions/errors');
const logger = require('./packages/logger');
const { whiteListOperation } = require('./config');

const {
  GRAPHQL_INTROSPECTION, GRAPHQL_PLAYGROUND, GRAPHQL_PORT,
} = process.env;
const introspection = GRAPHQL_INTROSPECTION === 'true';
const playground = GRAPHQL_PLAYGROUND === 'true';
const port = parseInt(GRAPHQL_PORT, 10);

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  formatError,
  cors: true,
  playground,
  introspection,
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    let user = '';

    if (token || !whiteListOperation.includes(req.body.operationName)) {
      user = verifyToken(token);

      // check token is blacklisted or not
      const { MysqlSlvTokenBlacklist } = connectors;
      const searchOpts = { where: { TOKEN: token } };

      const resTokenBlack = await MysqlSlvTokenBlacklist.findOne(searchOpts);
      if (resTokenBlack) {
        logger.error(`token --> by ${user.mail} returned blacklisted`);
        throw new ForbiddenError();
      }
    }

    // console.log(user);
    // user.mail = 'rafidah.arif@smebank.com.my';
    // user.userType = 'BC';
    return ({
      connectors,
      user,
    });
  },
});

const app = express();
app.use(express.json({ limit: '50mb' }));
apolloServer.applyMiddleware({ app });

// Create the HTTPS or HTTP server, per configuration
const server = https.createServer(
  {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CRT),
    minVersion: 'TLSv1.2',
  },
  app,
);

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen({ port }, () => {
  console.log(`🚀  Server ready at https://localhost:${port}${apolloServer.graphqlPath}`);
});
