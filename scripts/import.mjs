// Merges an external dataset into data/*.json without changing existing IDs.
// Dry run by default; pass --write to modify files and record provenance.
//
//   node scripts/import.mjs --source path.json --format brand-map \
//     --name "Source name" --url https://... --version <commit|release> \
//     --retrieved 2026-01-31 --license CC-BY-4.0 [--write]
//
// Formats: brand-map  {"Brand": ["Model", ...]}
//          flat       [{"make": "Brand", "model": "Model"}, ...]
// Other shapes need a small adapter that produces one of these.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { ROOT, loadData, validateData } from "./lib/data.mjs";

const { values: args } = parseArgs({
  options: {
    source: { type: "string" },
    format: { type: "string", default: "brand-map" },
    name: { type: "string" },
    url: { type: "string" },
    version: { type: "string" },
    retrieved: { type: "string" },
    license: { type: "string" },
    write: { type: "boolean", default: false },
  },
});

for (const key of ["source", "name", "url", "version", "retrieved", "license"]) {
  if (!args[key]) {
    console.error(`Missing --${key} (provenance must be recorded for every import)`);
    process.exit(2);
  }
}

const raw = JSON.parse(readFileSync(args.source, "utf8"));
const pairs =
  args.format === "brand-map"
    ? Object.entries(raw).flatMap(([make, list]) => list.map((model) => [make, model]))
    : args.format === "flat"
      ? raw.map((r) => [r.make, r.model])
      : (() => {
          throw new Error(`Unknown --format ${args.format}`);
        })();

const fold = (s) => s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const key = (s) => fold(s).replace(/[^a-z0-9]+/g, "");
const clean = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

const data = loadData();
const makeByKey = new Map(data.makes.map((m) => [key(m.name), m]));
for (const m of data.makes) for (const a of m.aliases) makeByKey.set(key(a), m);
const modelKeys = new Set(data.models.map((m) => `${m.makeId}|${key(m.name)}`));
const modelIds = new Set(data.models.map((m) => m.id));
const makeIds = new Set(data.makes.map((m) => m.id));

const added = { makes: [], models: [] };
let skipped = 0;
for (const [rawMake, rawModel] of pairs) {
  const makeName = clean(rawMake);
  const modelName = clean(rawModel);
  if (!makeName || !modelName || !slug(makeName) || !slug(modelName)) {
    skipped++;
    continue;
  }
  let make = makeByKey.get(key(makeName));
  if (!make) {
    let id = slug(makeName);
    while (makeIds.has(id)) id += "-2";
    make = { id, name: makeName, aliases: [] };
    makeIds.add(id);
    makeByKey.set(key(makeName), make);
    data.makes.push(make);
    added.makes.push(id);
  }
  if (modelKeys.has(`${make.id}|${key(modelName)}`)) continue;
  let id = `${make.id}/${slug(modelName)}`;
  while (modelIds.has(id)) id += "-2";
  modelIds.add(id);
  modelKeys.add(`${make.id}|${key(modelName)}`);
  data.models.push({ id, makeId: make.id, name: modelName, aliases: [] });
  added.models.push(id);
}

const errors = validateData(data);
console.log(
  `${args.write ? "Writing" : "Dry run"}: +${added.makes.length} makes, ` +
    `+${added.models.length} models, ${skipped} invalid row(s) skipped`,
);
if (added.makes.length) console.log("New makes:", added.makes.join(", "));
if (errors.length) {
  console.error("Result would be invalid:\n  - " + errors.join("\n  - "));
  process.exit(1);
}

if (args.write) {
  const write = (p, v) => writeFileSync(join(ROOT, p), JSON.stringify(v, null, 2) + "\n");
  write("data/makes.json", data.makes);
  write("data/models.json", data.models);
  const sourcesPath = join(ROOT, "docs", "sources.json");
  const sources = JSON.parse(readFileSync(sourcesPath, "utf8"));
  (sources.imports ??= []).push({
    name: args.name,
    url: args.url,
    version: args.version,
    retrieved: args.retrieved,
    license: args.license,
    addedMakes: added.makes.length,
    addedModels: added.models.length,
  });
  writeFileSync(sourcesPath, JSON.stringify(sources, null, 2) + "\n");
  console.log("Updated data/ and docs/sources.json. Review the diff before committing.");
}
