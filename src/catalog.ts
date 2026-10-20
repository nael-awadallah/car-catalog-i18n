import makesData from "../data/makes.json";
import modelsData from "../data/models.json";
import { normalizeSearchText } from "./normalize";
import type {
  Catalog,
  CatalogOptions,
  Make,
  Model,
  ModelSearchOptions,
  SearchOptions,
  TranslationEntry,
} from "./types";

interface MakeRecord {
  id: string;
  name: string;
  aliases: string[];
}

interface ModelRecord extends MakeRecord {
  makeId: string;
}

interface Entry<T> {
  item: T;
  keys: string[];
}

const hasOwn = (obj: object, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

function createCollator(locale: string | undefined): Intl.Collator {
  try {
    return new Intl.Collator(locale);
  } catch {
    return new Intl.Collator();
  }
}

function usableTranslation(
  table: Readonly<Record<string, TranslationEntry>> | undefined,
  id: string,
): TranslationEntry | undefined {
  if (!table || !hasOwn(table, id)) return undefined;
  const entry = table[id];
  return entry && typeof entry.name === "string" && entry.name.trim() !== ""
    ? entry
    : undefined;
}

function searchKeys(record: MakeRecord, translation?: TranslationEntry): string[] {
  const names = [record.name, ...record.aliases];
  if (translation) names.push(translation.name, ...(translation.aliases ?? []));
  const keys = new Set<string>();
  for (const name of names) {
    if (typeof name !== "string") continue;
    const key = normalizeSearchText(name);
    if (key) keys.add(key);
  }
  return [...keys];
}

function assertLimit(limit: number | undefined): void {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 0)) {
    throw new RangeError("`limit` must be a non-negative integer");
  }
}

function rank<T>(entries: readonly Entry<T>[], query: string, limit?: number): T[] {
  assertLimit(limit);
  const q = normalizeSearchText(typeof query === "string" ? query : "");
  let items: T[];
  if (q === "") {
    items = entries.map((e) => e.item);
  } else {
    const scored: { item: T; score: number; index: number }[] = [];
    entries.forEach((entry, index) => {
      let best = 3;
      for (const key of entry.keys) {
        if (key === q) {
          best = 0;
          break;
        }
        best = Math.min(best, key.startsWith(q) ? 1 : key.includes(q) ? 2 : 3);
      }
      if (best < 3) scored.push({ item: entry.item, score: best, index });
    });
    scored.sort((a, b) => a.score - b.score || a.index - b.index);
    items = scored.map((s) => s.item);
  }
  return limit === undefined ? items : items.slice(0, limit);
}

/**
 * Creates an independent catalog instance. Each instance holds its own locale
 * and translations, so concurrent requests never share language state.
 */
export function createCatalog(options: CatalogOptions = {}): Catalog {
  const { locale, translations } = options;
  const collator = createCollator(locale);
  const byDisplayName = <T extends { displayName: string; id: string }>(
    a: Entry<T>,
    b: Entry<T>,
  ) =>
    collator.compare(a.item.displayName, b.item.displayName) ||
    (a.item.id < b.item.id ? -1 : 1);

  const makeEntries: Entry<Make>[] = (makesData as MakeRecord[])
    .map((record) => {
      const tr = usableTranslation(translations?.makes, record.id);
      const item: Make = Object.freeze({
        id: record.id,
        name: record.name,
        displayName: tr ? tr.name : record.name,
        translated: tr !== undefined,
      });
      return { item, keys: searchKeys(record, tr) };
    })
    .sort(byDisplayName);

  const modelEntries: Entry<Model>[] = (modelsData as ModelRecord[])
    .map((record) => {
      const tr = usableTranslation(translations?.models, record.id);
      const item: Model = Object.freeze({
        id: record.id,
        makeId: record.makeId,
        name: record.name,
        displayName: tr ? tr.name : record.name,
        translated: tr !== undefined,
      });
      return { item, keys: searchKeys(record, tr) };
    })
    .sort(byDisplayName);

  const makeById = new Map(makeEntries.map((e) => [e.item.id, e.item]));
  const modelById = new Map(modelEntries.map((e) => [e.item.id, e.item]));
  const modelEntriesByMake = new Map<string, Entry<Model>[]>();
  for (const entry of modelEntries) {
    const list = modelEntriesByMake.get(entry.item.makeId);
    if (list) list.push(entry);
    else modelEntriesByMake.set(entry.item.makeId, [entry]);
  }

  return Object.freeze({
    locale,
    getMakes: () => makeEntries.map((e) => e.item),
    getModels: (makeId: string) =>
      (modelEntriesByMake.get(makeId) ?? []).map((e) => e.item),
    getAllModels: () => modelEntries.map((e) => e.item),
    getMake: (id: string) => makeById.get(id),
    getModel: (id: string) => modelById.get(id),
    searchMakes: (query: string, opts: SearchOptions = {}) =>
      rank(makeEntries, query, opts.limit),
    searchModels: (query: string, opts: ModelSearchOptions = {}) =>
      rank(
        opts.makeId === undefined
          ? modelEntries
          : (modelEntriesByMake.get(opts.makeId) ?? []),
        query,
        opts.limit,
      ),
  });
}
