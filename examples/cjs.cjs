const assert = require("node:assert/strict");
const { createCatalog } = require("car-catalog-i18n");
// CommonJS: locale files expose their translations on `.default`.
const ar = require("car-catalog-i18n/locales/ar").default;
const makes = require("car-catalog-i18n/data/makes.json");

const catalog = createCatalog({ locale: "ar", translations: ar });

assert.equal(catalog.getMake("toyota").displayName, "تويوتا");
assert.equal(catalog.searchMakes("تويو")[0].id, "toyota");
assert.equal(makes.length > 0, true);

console.log("cjs ok");
