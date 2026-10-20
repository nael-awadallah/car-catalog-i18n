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
