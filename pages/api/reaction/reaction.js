import _ from "lodash";
import mongodb from "mongodb";

import collectionIndex from "@reactioncommerce/api-utils/collectionIndex.js";
import getAbsoluteUrl from "@reactioncommerce/api-utils/getAbsoluteUrl.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Logger from "@reactioncommerce/logger";
import mongoConnectWithRetry from "@reactioncommerce/api-core/src/util/mongoConnectWithRetry.js";

import createApolloServer from "./createApolloServer.js";
// import importPluginsJSONFile from "@reactioncommerce/api-core/src/importPluginsJSONFile.js";
import coreResolvers from "@reactioncommerce/api-core/src/graphql/resolvers/index.js";

import builtInAppEvents from "@reactioncommerce/api-core/src/util/appEvents.js";

const coreGraphQLSchema = importAsString("@reactioncommerce/api-core/src/graphql/schema.graphql");

import envConfig from "./config";

import plugins from "./plugins";

export const config = {
  api: {
    bodyParser: false
  }
};

let apolloServer;
let handler;

const {
  REACTION_APOLLO_FEDERATION_ENABLED,
  REACTION_GRAPHQL_SUBSCRIPTIONS_ENABLED,
  MONGO_URL,
  PORT,
  REACTION_LOG_LEVEL,
  REACTION_SHOULD_INIT_REPLICA_SET,
  ROOT_URL
} = envConfig;

const debugLevels = ["DEBUG", "TRACE"];

const schemas = [coreGraphQLSchema];
let resolvers = _.merge({}, coreResolvers);

let mongoClient;
let db;
let context;

let collections = {};
let functionsByType = {};
let registeredPlugins = {};
const expressMiddleware = [];

function startServer(req, res) {
  if (!handler) {
    console.log("calling createApolloServer");
    const { apolloServer: apolloServerCallback } = createApolloServer({
      context,
      debug: debugLevels.includes(REACTION_LOG_LEVEL),
      expressMiddleware,
      resolvers,
      schemas
    });

    apolloServer = apolloServerCallback;

    handler = apolloServer.createHandler({
      path: "/api/reaction/reaction"
    });
  }

  return handler.apply(this, arguments);
}

function _registerFunctionsByType(functionsByType, pluginName) {
  if (functionsByType) {
    Object.keys(functionsByType).forEach((type) => {
      if (!Array.isArray(functionsByType[type])) {
        functionsByType[type] = [];
      }
      functionsByType[type].forEach((func) => {
        const entryWithSameName = functionsByType[type].find(
          (existingEntry) => existingEntry.func && existingEntry.func.name === func.name
        );
        console.log("entryWithSameName", entryWithSameName);
        if (entryWithSameName) {
          Logger.warn(
            `Plugin "${pluginName}" registers a function of type "${type}" named "${func.name}", ` +
              `but plugin "${entryWithSameName.pluginName}" has already registered a function of type "${type}" named "${entryWithSameName.func.name}".` +
              " We recommend you choose a unique and descriptive name for all functions passed to `functionsByType` to help with debugging."
          );
        }

        functionsByType[type].push({ func, pluginName });
      });
    });
  }
}

/**
 * @summary Use this method to provide the MongoDB database instance.
 *   A side effect is that `collections`/`context.collections`
 *   will have all collections available on it after this is called.
 * @param {Database} db MongoDB library database instance
 * @returns {undefined}
 */
async function setMongoDatabase(dbInput) {
  db = dbInput;

  // Reset these
  collections = {};
  context.collections = collections;

  // Loop through all registered plugins
  for (const pluginName in registeredPlugins) {
    if ({}.hasOwnProperty.call(registeredPlugins, pluginName)) {
      const pluginConfig = registeredPlugins[pluginName];

      // If a plugin config has `collections` key
      if (pluginConfig.collections) {
        // Loop through `collections` object keys
        for (const collectionKey in pluginConfig.collections) {
          if ({}.hasOwnProperty.call(pluginConfig.collections, collectionKey)) {
            const collectionConfig = pluginConfig.collections[collectionKey];

            // Validate that the `collections` key value is an object and has `name`
            if (!collectionConfig || typeof collectionConfig.name !== "string" || collectionConfig.name.length === 0) {
              throw new Error(`In registerPlugin, collection "${collectionKey}" needs a name property`);
            }

            // Validate that the `collections` key hasn't already been taken by another plugin
            if (collections[collectionKey]) {
              throw new Error(
                `Plugin ${pluginName} defines a collection with key "${collectionKey}" in registerPlugin,` +
                  " but another plugin has already defined a collection with that key"
              );
            }

            // Pass through certain supported collection options
            const collectionOptions = {};
            if (collectionConfig.jsonSchema) {
              collectionOptions.validator = {
                $jsonSchema: collectionConfig.jsonSchema
              };
            } else if (collectionConfig.validator) {
              collectionOptions.validator = collectionConfig.validator;
            }

            if (collectionConfig.validationLevel) {
              collectionOptions.validationLevel = collectionConfig.validationLevel;
            }
            if (collectionConfig.validationAction) {
              collectionOptions.validationAction = collectionConfig.validationAction;
            }

            /* eslint-disable promise/no-promise-in-callback */

            // Add the collection instance to `context.collections`.
            // If the collection already exists, we need to modify it instead of calling
            // `createCollection`, in order to add validation options.
            const getCollectionPromise = new Promise((resolve, reject) => {
              db.collection(collectionConfig.name, { strict: true }, (error, collection) => {
                if (error) {
                  // Collection with this name doesn't yet exist
                  db.createCollection(collectionConfig.name, collectionOptions)
                    .then((newCollection) => {
                      resolve(newCollection);
                      return null;
                    })
                    .catch(reject);
                } else {
                  // Collection with this name exists, so modify before resolving
                  db.command({ collMod: collectionConfig.name, ...collectionOptions })
                    .then(() => {
                      resolve(collection);
                      return null;
                    })
                    .catch(reject);
                }
              });
            });

            /* eslint-enable promise/no-promise-in-callback */

            collections[collectionKey] = await getCollectionPromise; // eslint-disable-line no-await-in-loop

            // If the collection config has `indexes` key, define all requested indexes
            if (Array.isArray(collectionConfig.indexes)) {
              const indexingPromises = collectionConfig.indexes.map((indexArgs) =>
                collectionIndex(collections[collectionKey], ...indexArgs)
              );
              await Promise.all(indexingPromises); // eslint-disable-line no-await-in-loop
            }
          }
        }
      }
    }
  }
}

/**
 * @summary Given a MongoDB URL, creates a connection to it, sets `mongoClient`,
 *   calls `setMongoDatabase` with the database instance, and then
 *   resolves the Promise.
 * @param {Object} options Options object
 * @param {String} [options.mongoUrl] MongoDB connection URL. Default is MONGO_URL env.
 * @returns {Promise<undefined>} Nothing
 */
async function connectToMongo(options = {}) {
  // connectOptionsSchema.validate(options);

  const { mongoUrl = MONGO_URL } = options;

  const client = await mongoConnectWithRetry(mongoUrl);

  mongoClient = client;
  await setMongoDatabase(client.db()); // Uses db name from the connection string
}

/**
 * @summary Plugins should call this to register everything they provide.
 *   This is a non-Meteor replacement for the old `Reaction.registerPackage`.
 * @param {Object} plugin Plugin configuration object
 * @returns {Promise<undefined>} Nothing
 */
async function registerPlugin(plugin = {}) {
  if (typeof plugin.name !== "string" || plugin.name.length === 0) {
    throw new Error("Plugin configuration passed to registerPlugin must have 'name' field");
  }

  if (registeredPlugins[plugin.name]) {
    throw new Error(`You registered multiple plugins with the name "${plugin.name}"`);
  }

  registeredPlugins[plugin.name] = plugin;

  if (plugin.graphQL) {
    if (plugin.graphQL.resolvers) {
      _.merge(resolvers, plugin.graphQL.resolvers);
    }
    if (plugin.graphQL.schemas) {
      // console.log("plugin.graphQL.schemas", plugin.graphQL.schemas);
      schemas.push(...plugin.graphQL.schemas);
    }
  }

  if (plugin.mutations) {
    _.merge(context.mutations, plugin.mutations);
  }

  if (plugin.queries) {
    // console.log("plugin.queries", plugin.queries);
    _.merge(context.queries, plugin.queries);
    // console.log("context.queries", context.queries);
  }

  if (plugin.auth) {
    Object.keys(plugin.auth).forEach((key) => {
      if (context.auth[key]) {
        throw new Error(
          `Plugin "${plugin.name} tried to register auth function "${key}" but another plugin already registered this type of function`
        );
      }
      context.auth[key] = plugin.auth[key];
    });
  }

  _registerFunctionsByType(plugin.functionsByType, plugin.name);

  if (Array.isArray(plugin.expressMiddleware)) {
    expressMiddleware.push(...plugin.expressMiddleware.map((def) => ({ ...def, pluginName: plugin.name })));
  }

  if (plugin.contextAdditions) {
    Object.keys(plugin.contextAdditions).forEach((key) => {
      if ({}.hasOwnProperty.call(context, key)) {
        throw new Error(`Plugin ${plugin.name} is trying to add ${key} key to context but it's already there`);
      }
      context[key] = plugin.contextAdditions[key];
    });
  }

  Logger.info(`Registered plugin ${plugin.name} (${plugin.version || "no version"})`);
}

/**
 * @summary Register all plugins in the order listed. Each plugin may be the
 *   object with the registration info or a function that takes the API
 *   instance and will call `registerPlugin` on its own.
 * @param {Object} plugins Object listing plugins like:
 *   {
 *     name: function or registration object
 *   }
 * @returns {Promise<undefined>} Nothing
 */
async function registerPlugins(plugins) {
  /* eslint-disable no-await-in-loop */

  for (const [name, plugin] of Object.entries(plugins)) {
    if (typeof plugin === "function") {
      // await plugin(this);
      console.log("Calling await plugin for", name);
      await plugin({ registerPlugin });
    } else if (typeof plugin === "object") {
      await registerPlugin(plugin);
    } else {
      Logger.error({ name, plugin }, "Plugin is not a function or object and was skipped");
    }
  }

  /* eslint-enable no-await-in-loop */
}

export default async function start(req, res) {
  // const plugins = await importPluginsJSONFile("./plugins.json");

  // Start Manual Plugins json solution
  // const plugins = await transformPlugins();
  // End

  const rootUrl = `http://${req.headers.host}/`;

  if (!context) {
    context = {
      rootUrl,
      getAbsoluteUrl: (path) => getAbsoluteUrl(rootUrl, path),
      appEvents: builtInAppEvents,
      appVersion: "3.8.0",
      auth: {},
      collections,
      /**
       * @summary When calling a query or mutation function that checks permissions from another
       *   query or mutation where you have already checked permissions, or from system code such
       *   as a background job or ETL process, call `context.getInternalContext()` and pass the
       *   result as the `context` argument. This will bypass all permission checks in the function
       *   you are calling.
       * @return {Object} Context object with permission to do anything
       */
      getInternalContext: () => ({
        ...context,
        account: null,
        accountId: null,
        isInternalCall: true,
        user: null,
        userHasPermission: async () => true,
        userId: null,
        validatePermissions: async () => undefined
      }),
      getFunctionsOfType: (type) => (functionsByType[type] || []).map(({ func }) => func),
      mutations: {},
      queries: {}
    };
  }

  // const { mongoUrl = MONGO_URL, shouldInitReplicaSet = REACTION_SHOULD_INIT_REPLICA_SET, silent = false } = options;

  if (!Object.entries(registeredPlugins).length) {
    await registerPlugins(plugins);
  }

  if (!mongoClient) {
    await connectToMongo({ mongoUrl: MONGO_URL });
  }

  return startServer.apply(this, arguments);
}
