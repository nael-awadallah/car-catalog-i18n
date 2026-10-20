import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const readJson = (...parts) =>
  JSON.parse(readFileSync(join(ROOT, ...parts), "utf8"));

export function loadData() {
  const locales = {};
  for (const file of readdirSync(join(ROOT, "locales"))) {
    if (file.endsWith(".json")) {
      locales[file.slice(0, -".json".length)] = readJson("locales", file);
    }
  }
  return {
    makes: readJson("data", "makes.json"),
    models: readJson("data", "models.json"),
    locales,
  };
}

/** Returns a list of human-readable problems; empty means the data is valid. */
export function validateData({ makes, models, locales }) {
  const errors = [];
  const ajv = new Ajv({ allErrors: true });
  const check = (schemaFile, data, label) => {
    const validate = ajv.compile(readJson("schemas", schemaFile));
    if (!validate(data)) {
      for (const e of validate.errors.slice(0, 20)) {
        errors.push(`${label}${e.instancePath}: ${e.message}`);
      }
      return false;
    }
    return true;
  };

  const makesOk = check("makes.schema.json", makes, "data/makes.json");
  const modelsOk = check("models.schema.json", models, "data/models.json");
  const localesOk = Object.entries(locales).map(([code, data]) =>
    check("locale.schema.json", data, `locales/${code}.json`),
  );
  if (!makesOk || !modelsOk || localesOk.includes(false)) return errors;

  const makeIds = new Set();
  for (const make of makes) {
    if (makeIds.has(make.id)) errors.push(`duplicate make id: ${make.id}`);
    makeIds.add(make.id);
  }

  const usedMakes = new Set(models.map((m) => m.makeId));
  for (const make of makes) {
    if (!usedMakes.has(make.id)) errors.push(`make ${make.id} has no models`);
  }

  const modelIds = new Set();
  const namesPerMake = new Map();
  for (const model of models) {
    if (modelIds.has(model.id)) errors.push(`duplicate model id: ${model.id}`);
    modelIds.add(model.id);
    if (!makeIds.has(model.makeId)) {
      errors.push(`model ${model.id} references unknown make: ${model.makeId}`);
    }
    if (!model.id.startsWith(`${model.makeId}/`)) {
      errors.push(`model id ${model.id} must start with "${model.makeId}/"`);
    }
    const key = `${model.makeId}|${model.name.toLowerCase()}`;
    if (namesPerMake.has(key)) {
      errors.push(
        `models ${namesPerMake.get(key)} and ${model.id} share the name "${model.name}"`,
      );
    }
    namesPerMake.set(key, model.id);
  }

  for (const [code, locale] of Object.entries(locales)) {
    for (const id of Object.keys(locale.makes)) {
      if (!makeIds.has(id)) errors.push(`locales/${code}.json: unknown make id ${id}`);
    }
    for (const id of Object.keys(locale.models)) {
      if (!modelIds.has(id)) errors.push(`locales/${code}.json: unknown model id ${id}`);
    }
  }

  errors.push(...findAliasCollisions({ makes, models, locales }));
  return errors;
}

// Mirrors normalizeSearchText in src/normalize.ts (kept dependency-free for scripts).
const normalizeKey = (value) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/ـ/g, "")
    .replace(/[آأإٱ]/g, "ا")
    .toLowerCase()
    .replace(/[-_‐-―]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Collisions that exist today and cannot be fixed without removing public IDs
 * (duplicate regional records) or changing correct names (إ/آ fold to ا when
 * searching). New collisions are errors; do not add to this list lightly.
 */
const KNOWN_COLLISIONS = new Set([
  "honda/fit|honda/jazz",
  "hyundai/azera|hyundai/grandeur",
  "mitsubishi/l200|mitsubishi/triton",
  "subaru/crosstrek|subaru/xv",
  "ford/escape|ford/kuga",
  "chrysler/300|chrysler/300c",
  "volkswagen/atlas|volkswagen/teramont",
  "byd/atto-3|byd/yuan-plus",
  "lexus/es|lexus/is",
  "jaguar/e-pace|jaguar/i-pace",
]);

/**
 * A search key (name or alias after normalization) that maps to two different
 * makes, or two different models of one make, makes exact-match ranking ambiguous.
 */
function findAliasCollisions({ makes, models, locales }) {
  const errors = [];
  const collect = (records, scope, label) => {
    const seen = new Map();
    for (const record of records) {
      const names = [record.name, ...record.aliases];
      for (const [code, locale] of Object.entries(locales)) {
        const tr = (scope === "make" ? locale.makes : locale.models)[record.id];
        if (tr) names.push(tr.name, ...(tr.aliases ?? []));
      }
      for (const key of new Set(names.map(normalizeKey).filter(Boolean))) {
        const first = seen.get(key);
        if (first && first !== record.id) {
          if (KNOWN_COLLISIONS.has([first, record.id].sort().join("|"))) continue;
          errors.push(`${label}: "${key}" is used by both ${first} and ${record.id}`);
        } else seen.set(key, record.id);
      }
    }
  };
  collect(makes, "make", "make search key");
  const byMake = new Map();
  for (const model of models) {
    if (!byMake.has(model.makeId)) byMake.set(model.makeId, []);
    byMake.get(model.makeId).push(model);
  }
  for (const [makeId, list] of byMake) collect(list, "model", `model search key in ${makeId}`);
  return errors;
}

/** Translated/missing counts per locale. */
export function computeCoverage({ makes, models, locales }) {
  const perLocale = {};
  for (const [code, locale] of Object.entries(locales)) {
    const missingMakes = makes.filter((m) => !locale.makes[m.id]).map((m) => m.id);
    const missingModels = models.filter((m) => !locale.models[m.id]).map((m) => m.id);
    perLocale[code] = {
      translatedMakes: makes.length - missingMakes.length,
      translatedModels: models.length - missingModels.length,
      missingMakes,
      missingModels,
    };
  }
  return { makes: makes.length, models: models.length, locales: perLocale };
}
