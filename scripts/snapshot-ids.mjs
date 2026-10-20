import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadData } from "./lib/data.mjs";

const { makes, models } = loadData();
const snapshot = {
  makes: makes.map((m) => m.id).sort(),
  models: models.map((m) => m.id).sort(),
};
writeFileSync(join(ROOT, "tests", "ids.snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Snapshot written: ${snapshot.makes.length} makes, ${snapshot.models.length} models`);
