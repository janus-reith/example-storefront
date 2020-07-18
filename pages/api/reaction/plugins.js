import shops from "@reactioncommerce/api-plugin-shops";
import simpleSchema from "@reactioncommerce/api-plugin-simple-schema";
import accounts from "@reactioncommerce/api-plugin-accounts";
import products from "@reactioncommerce/api-plugin-products";
import catalogs from "@reactioncommerce/api-plugin-catalogs";
import carts from "@reactioncommerce/api-plugin-carts";
import shipments from "@reactioncommerce/api-plugin-shipments";
import tags from "@reactioncommerce/api-plugin-tags";
// import pluginRefs from "./plugins.json";

/*
async function transformPlugins() {
    const plugins = {};
    for (const [name, pluginPath] of Object.entries(pluginRefs)) {
      let plugin;
  
      // Distinguish between pre-imported modules, node module paths, and relative/absolute paths
      if (typeof pluginPath !== "string") {
        Logger.debug({ pluginPath, pluginRefs });
        throw new Error(`Plugin "${name}" is not set to a string`);
      } else if (/[a-zA-Z@]/.test(pluginPath[0])) {
        console.log("direct import for pluginPath", pluginPath);
        ({ default: plugin } = await import(pluginPath));
        console.log("awaited import");
      } else {
        ({ default: plugin } = await import(path.join(path.dirname(absolutePluginsFile), pluginPath)));
      }
  
      plugins[name] = plugin;
    }
  }
  */

const plugins = {
  accounts,
  shops,
  simpleSchema,
  products,
  catalogs,
  carts,
  shipments,
  tags,
};

export default plugins;
