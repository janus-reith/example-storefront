const { ApolloServer, gql } = require("apollo-server-micro");
const { buildFederatedSchema } = require("@apollo/federation");

const typeDefs = gql`
  extend type Query {
    topProductHandlerDemos(first: Int = 5): [ProductHandlerDemo]
  }

  type ProductHandlerDemo @key(fields: "upc") {
    upc: String!
    name: String
    price: Int
    weight: Int
  }
`;

const resolvers = {
  ProductHandlerDemo: {
    __resolveReference(object) {
      return products.find((product) => product.upc === object.upc);
    },
  },
  Query: {
    topProductHandlerDemos(_, args) {
      return products.slice(0, args.first);
    },
  },
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers,
    },
  ]),
  introspection: true,
  playground: true,
});

export default server.createHandler({ path: "/api/reaction/products" });

export const config = {
  api: {
    bodyParser: false,
  },
};

const products = [
  {
    upc: "1",
    name: "Table",
    price: 899,
    weight: 100,
  },
  {
    upc: "2",
    name: "Couch",
    price: 1299,
    weight: 1000,
  },
  {
    upc: "3",
    name: "Chair",
    price: 54,
    weight: 50,
  },
];
