import simpleSchema from "@reactioncommerce/api-plugin-simple-schema";
import jobQueue from "@reactioncommerce/api-plugin-job-queue";
import files from "@reactioncommerce/api-plugin-files";
import shops from "@reactioncommerce/api-plugin-shops";
import settings from "@reactioncommerce/api-plugin-settings";
import i18 from "@reactioncommerce/api-plugin-i18n";
import email from "@reactioncommerce/api-plugin-email";
import addressValidation from "@reactioncommerce/api-plugin-address-validation";
import translations from "@reactioncommerce/api-plugin-translations";
import systemInformation from "@reactioncommerce/api-plugin-system-information";
import emailSMTP from "@reactioncommerce/api-plugin-email-smtp";
import emailTemplates from "@reactioncommerce/api-plugin-email-templates";
import accounts from "@reactioncommerce/api-plugin-accounts";
import authentication from "@reactioncommerce/api-plugin-authentication";
import authorization from "@reactioncommerce/api-plugin-authorization-simple";
import products from "@reactioncommerce/api-plugin-products";
import catalogs from "@reactioncommerce/api-plugin-catalogs";
import tags from "@reactioncommerce/api-plugin-tags";
import pricingSimple from "@reactioncommerce/api-plugin-pricing-simple";
import inventory from "@reactioncommerce/api-plugin-inventory";
import inventorySimple from "@reactioncommerce/api-plugin-inventory-simple";
import carts from "@reactioncommerce/api-plugin-carts";
import orders from "@reactioncommerce/api-plugin-orders";
import payments from "@reactioncommerce/api-plugin-payments";
import paymentsStripe from "@reactioncommerce/api-plugin-payments-stripe";
import paymentsExample from "@reactioncommerce/api-plugin-payments-example";
import discounts from "@reactioncommerce/api-plugin-discounts";
import discountCodes from "@reactioncommerce/api-plugin-discounts-codes";
import surcharges from "@reactioncommerce/api-plugin-surcharges";
import shipments from "@reactioncommerce/api-plugin-shipments";
import shipmentsFlatRate from "@reactioncommerce/api-plugin-shipments-flat-rate";
import taxes from "@reactioncommerce/api-plugin-taxes";
import taxesFlatRate from "@reactioncommerce/api-plugin-taxes-flat-rate";
import navigation from "@reactioncommerce/api-plugin-navigation";
import sitemapGenerator from "@reactioncommerce/api-plugin-sitemap-generator";
import notifications from "@reactioncommerce/api-plugin-notifications";
import addressValidationTest from "@reactioncommerce/api-plugin-address-validation-test";

const plugins = {
  shipments,
  simpleSchema,
  jobQueue,
  files,
  shops,
  settings,
  i18,
  email,
  addressValidation,
  translations,
  systemInformation,
  emailSMTP,
  emailTemplates,
  accounts,
  authentication,
  authorization,
  products,
  catalogs,
  tags,
  pricingSimple,
  inventory,
  inventorySimple,
  carts,
  orders,
  payments,
  paymentsStripe,
  paymentsExample,
  discounts,
  // discountCodes,
  surcharges,
  shipmentsFlatRate,
  taxes,
  taxesFlatRate,
  navigation,
  sitemapGenerator,
  notifications,
  addressValidationTest
};

export default plugins;
