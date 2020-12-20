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

// const {
//   introspection, playground, port,
// } = apollo[process.env.NODE_ENV];

// const { key, crt } = ssl[process.env.NODE_ENV];

const introspection = process.env.GRAPHQL_INTROSPECTION === 'true';
const playground = process.env.GRAPHQL_PLAYGROUND === 'true';
const port = parseInt(process.env.GRAPHQL_PORT, 10);

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
  context: ({ req }) => {
    const user = req.headers.authorization || '';
    // console.log(user);
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
  },
  app,
);

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen({ port }, () => {
  console.log(`🚀  Server ready at https://localhost:${port}${apolloServer.graphqlPath}`);
});
