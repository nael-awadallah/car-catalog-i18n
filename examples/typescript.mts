import { createCatalog } from "car-catalog-i18n";
import type { Catalog, Make, Model } from "car-catalog-i18n";
import ar from "car-catalog-i18n/locales/ar";

const catalog: Catalog = createCatalog({ locale: "ar", translations: ar });

const makes: Make[] = catalog.searchMakes("تويو", { limit: 5 });
const models: Model[] = catalog.searchModels("كامري", { makeId: "toyota", limit: 20 });
const camry: Model | undefined = catalog.getModel("toyota/camry");

console.log(makes.length, models.length, camry?.displayName);
