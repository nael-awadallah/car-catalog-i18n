import { loadData, validateData } from "./lib/data.mjs";

const data = loadData();
const errors = validateData(data);

if (errors.length > 0) {
  console.error(`Data validation failed (${errors.length} problem(s)):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `Data OK: ${data.makes.length} makes, ${data.models.length} models, ` +
    `${Object.keys(data.locales).length} locale(s)`,
);
