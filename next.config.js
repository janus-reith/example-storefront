const path = require("path");
const appConfig = require("./config");

const withTM = require("next-transpile-modules")([
  "@reactioncommerce/api-utils",
  "@reactioncommerce/api-core",
  "@reactioncommerce/api-plugin-shops",
  "@reactioncommerce/api-plugin-simple-schema",
  "@reactioncommerce/api-plugin-accounts",
  "@reactioncommerce/api-plugin-address-validation",
  "@reactioncommerce/api-plugin-address-validation-test",
  "@reactioncommerce/api-plugin-authentication",
  "@reactioncommerce/api-plugin-authorization-simple",
  "@reactioncommerce/api-plugin-carts",
  "@reactioncommerce/api-plugin-catalogs",
  "@reactioncommerce/api-plugin-discounts",
  "@reactioncommerce/api-plugin-discounts-codes",
  "@reactioncommerce/api-plugin-email",
  "@reactioncommerce/api-plugin-email-smtp",
  "@reactioncommerce/api-plugin-email-templates",
  "@reactioncommerce/api-plugin-files",
  "@reactioncommerce/api-plugin-i18n",
  "@reactioncommerce/api-plugin-inventory",
  "@reactioncommerce/api-plugin-inventory-simple",
  "@reactioncommerce/api-plugin-job-queue",
  "@reactioncommerce/api-plugin-navigation",
  "@reactioncommerce/api-plugin-notifications",
  "@reactioncommerce/api-plugin-orders",
  "@reactioncommerce/api-plugin-payments",
  "@reactioncommerce/api-plugin-payments-example",
  "@reactioncommerce/api-plugin-payments-stripe",
  "@reactioncommerce/api-plugin-pricing-simple",
  "@reactioncommerce/api-plugin-products",
  "@reactioncommerce/api-plugin-settings",
  "@reactioncommerce/api-plugin-shipments",
  "@reactioncommerce/api-plugin-shipments-flat-rate",
  "@reactioncommerce/api-plugin-shops",
  "@reactioncommerce/api-plugin-simple-schema",
  "@reactioncommerce/api-plugin-sitemap-generator",
  "@reactioncommerce/api-plugin-surcharges",
  "@reactioncommerce/api-plugin-system-information",
  "@reactioncommerce/api-plugin-tags",
  "@reactioncommerce/api-plugin-taxes",
  "@reactioncommerce/api-plugin-taxes-flat-rate",
  "@reactioncommerce/api-plugin-translations",
  "@reactioncommerce/db-version-check"
]);

module.exports = withTM({
  env: {
    CANONICAL_URL: appConfig.CANONICAL_URL,
    INTERNAL_GRAPHQL_URL: appConfig.INTERNAL_GRAPHQL_URL,
    EXTERNAL_GRAPHQL_URL: appConfig.EXTERNAL_GRAPHQL_URL,
    SEGMENT_ANALYTICS_SKIP_MINIMIZE: appConfig.SEGMENT_ANALYTICS_SKIP_MINIMIZE,
    SEGMENT_ANALYTICS_WRITE_KEY: appConfig.SEGMENT_ANALYTICS_WRITE_KEY,
    STRIPE_PUBLIC_API_KEY: appConfig.STRIPE_PUBLIC_API_KEY,
    ENABLE_SPA_ROUTING: appConfig.ENABLE_SPA_ROUTING
  },
  webpack: (webpackConfig) => {
    webpackConfig.module.rules.push({
      test: /\.(gql|graphql)$/,
      loader: "graphql-tag/loader",
      exclude: ["/node_modules/", "/.next/"],
      enforce: "pre"
    });

    webpackConfig.module.rules.push({
      test: /\.mjs$/,
      type: "javascript/auto"
    });

    // Duplicate versions of the styled-components package were being loaded, this config removes the duplication.
    // It creates an alias to import the es modules version of the styled-components package.
    // This is a workaround until the root issue is resolved: https://github.com/webpack/webpack/issues/9329
    webpackConfig.resolve.alias["styled-components"] = "styled-components/dist/styled-components.browser.esm.js";

    webpackConfig.resolve.alias.components = path.join(__dirname, "components");
    webpackConfig.resolve.alias.containers = path.join(__dirname, "containers");
    webpackConfig.resolve.alias.context = path.join(__dirname, "context");
    webpackConfig.resolve.alias.custom = path.join(__dirname, "custom");
    webpackConfig.resolve.alias.hocs = path.join(__dirname, "hocs");
    webpackConfig.resolve.alias.hooks = path.join(__dirname, "hooks");
    webpackConfig.resolve.alias.lib = path.join(__dirname, "lib");
    webpackConfig.resolve.alias.pages = path.join(__dirname, "pages");
    webpackConfig.resolve.alias.public = path.join(__dirname, "public");
    webpackConfig.resolve.alias.static = path.join(__dirname, "static");
    webpackConfig.resolve.alias.serverUtils = path.join(__dirname, "serverUtils");
    webpackConfig.resolve.alias.translations = path.join(__dirname, "translations");
    webpackConfig.resolve.alias.routes = path.join(__dirname, "routes");
    webpackConfig.resolve.alias.utils = path.join(__dirname, "utils");
    webpackConfig.resolve.alias.staticUtils = path.join(__dirname, "staticUtils");
    webpackConfig.resolve.alias.apiUtils = path.join(__dirname, "apiUtils");

    webpackConfig.resolve.alias["@reactioncommerce/api-utils"] = "@reactioncommerce/api-utils/lib";

    /*
    webpackConfig.resolve.alias["@reactioncommerce/api-utils/lib/importAsString.js"] = path.join(
      __dirname,
      "importAsString.js"
    );
    */

    return webpackConfig;
  },
  experimental: {
    redirects() {
      return [
        {
          source: "/graphiql",
          destination: appConfig.EXTERNAL_GRAPHQL_URL,
          permanent: true
        },
        {
          source: "/graphql-beta",
          destination: appConfig.EXTERNAL_GRAPHQL_URL,
          permanent: true
        },
        {
          source: "/graphql-alpha",
          destination: appConfig.EXTERNAL_GRAPHQL_URL,
          permanent: true
        }
        /*
        {
          source: "/graphql",
          destination: appConfig.EXTERNAL_GRAPHQL_URL,
          permanent: true
        }
        */
      ];
    },
    rewrites() {
      return [
        {
          source: "/graphql",
          destination: "/api/reaction/graphql"
        },
        // Sitemap
        {
          source: "/sitemap:subPage?.xml",
          destination: "/api/sitemap"
        },
        // Accounts
        {
          source: "/change-password",
          destination: "/api/account/changePassword"
        },
        {
          source: "/post-logout-callback",
          destination: "/api/account/postLogoutCallback"
        },
        {
          source: "/token",
          destination: "/api/account/token"
        },
        {
          source: "/signin",
          destination: "/api/account/signin"
        },
        {
          source: "/signup",
          destination: "/api/account/signup"
        },
        {
          source: "/callback",
          destination: "/api/account/callback"
        },
        {
          source: "/logout",
          destination: "/api/account/logout"
        },
        {
          source: "/refresh",
          destination: "/api/account/refresh"
        },
        {
          source: "/",
          destination: "/api/detectLanguage"
        }
      ];
    }
  }
});
