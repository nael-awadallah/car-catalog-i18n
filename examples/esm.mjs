import assert from "node:assert/strict";
import { createCatalog } from "car-catalog-i18n";
import ar from "car-catalog-i18n/locales/ar";
import makes from "car-catalog-i18n/data/makes.json" with { type: "json" };
import models from "car-catalog-i18n/data/models.json" with { type: "json" };

const catalog = createCatalog({ locale: "ar", translations: ar });

assert.equal(catalog.getMake("toyota")?.displayName, "تويوتا");
assert.equal(catalog.getModels("toyota").length > 0, true);
assert.equal(catalog.searchModels("كامري", { makeId: "toyota" })[0]?.id, "toyota/camry");
assert.equal(createCatalog().searchModels("camry")[0]?.id, "toyota/camry");
assert.equal(makes.length > 0 && models.length > 0, true);

console.log("esm ok");
