import envConfig from "./config.js";
import buildContext from "@reactioncommerce/api-core/src/util/buildContext.js";
import getErrorFormatter from "./util/getErrorFormatter.js";
// import createDataLoaders from "./util/createDataLoaders.js";
import { ApolloServer, gql, makeExecutableSchema, mergeSchemas } from "apollo-server-micro";
const { buildFederatedSchema } = require("@apollo/federation");

// const DEFAULT_GRAPHQL_PATH = "/graphql";
const DEFAULT_GRAPHQL_PATH = "/api/reaction/reaction";

const resolverValidationOptions = {
  // After we fix all errors that this prints, we should probably go
  // back to `true` (the default)
  requireResolversForResolveType: false,
};

const typeDefs = gql`
  type Query {
    usersHandlerDemo: [UserHandlerDemo!]!
    userHandlerDemo(username: String): UserHandlerDemo
  }
  type UserHandlerDemo {
    name: String
    username: String
  }
`;
const users = [
  { name: "Leeroy Jenkins", username: "leeroy" },
  { name: "Foo Bar", username: "foobar" },
];

const resolvers = {
  Query: {
    usersHandlerDemo() {
      return users;
    },
    userHandlerDemo(parent, { username }) {
      return users.find((user) => user.username === username);
    },
  },
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function createApolloServer(options = {}) {
  const { context: contextFromOptions, expressMiddleware, resolvers } = options;
  const path = options.path || DEFAULT_GRAPHQL_PATH;

  // We support passing in typeDef strings.
  // Already executable schema are not supported with federation.
  const schemas = options.schemas || [];
  const executableSchemas = schemas.filter((td) => typeof td !== "string");
  const typeDefs = schemas.filter((td) => typeof td === "string");

  if (schemas.length === 0) {
    throw new Error("No type definitions (schemas) provided for GraphQL");
  }

  if (executableSchemas.length && config.REACTION_APOLLO_FEDERATION_ENABLED) {
    throw new Error("Executable schemas are not supported with Apollo Federation.");
  }

  // const schema = makeExecutableSchema({ typeDefs, resolvers, resolverValidationOptions });

  const schema = buildFederatedSchema([
    {
      typeDefs: gql(typeDefs.join(" ")),
      resolvers,
    },
  ]);

  /*
  const schema = buildFederatedSchema([
    {
      typeDefs,
      resolvers,
    },
  ]);
  */

  //const apolloServer = new ApolloServer({ schema });

  const apolloServer = new ApolloServer({
    async context({ connection, req }) {
      const context = { ...contextFromOptions };

      // For a GraphQL subscription WebSocket request, there is no `req`
      if (connection) return context;

      // Express middleware should have already set req.user if there is one
      await buildContext(context, req);

      // await createDataLoaders(context);

      return context;
    },
    debug: options.debug || false,
    formatError: getErrorFormatter(),
    schema,
    // subscriptions,
    introspection: envConfig.GRAPHQL_INTROSPECTION_ENABLED,
    playground: envConfig.GRAPHQL_PLAYGROUND_ENABLED,
  });

  return {
    apolloServer,
    path,
  };
}
