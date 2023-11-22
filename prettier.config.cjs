const { salesforcePrettierConfig } = require("@salesforce/prettier-config");

/** @type {import("prettier").Config} */
const config = {
  ...salesforcePrettierConfig,
  singleQuote: false,
};

module.exports = config;
