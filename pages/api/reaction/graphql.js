const { ApolloServer } = require("apollo-server-micro");
const { ApolloGateway } = require("@apollo/gateway");

let gateway;
let apolloServer;
let handler;

export default async function start(req, res) {
  const host = `http://${req.headers.host}`;

  if (!handler) {
    gateway = new ApolloGateway({
      serviceList: [
        {
          name: `reaction`,
          url: `${host}/api/reaction/reaction`,
        },
        {
          name: `products`,
          url: `${host}/api/reaction/products`,
        },
        {
          name: `inventory`,
          url: `${host}/api/reaction/inventory`,
        },
      ],
      debug: true,
    });

    apolloServer = new ApolloServer({
      gateway,
      subscriptions: false,
      introspection: true,
      playground: true,
    });

    handler = apolloServer.createHandler({ path: "/graphql" });
  }

  return handler.apply(this, arguments);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
