/** A translated name and optional search aliases for one catalog record. */
export interface TranslationEntry {
  name: string;
  aliases?: readonly string[];
}

/** A locale file: translations keyed by canonical make ID and model ID. */
export interface Translations {
  makes?: Readonly<Record<string, TranslationEntry>>;
  models?: Readonly<Record<string, TranslationEntry>>;
}

export interface CatalogOptions {
  /** BCP 47 tag used for sorting display names (e.g. "ar"). */
  locale?: string;
  /** Translations to apply. Load them explicitly, e.g. `car-catalog-i18n/locales/ar`. */
  translations?: Translations;
}

export interface Make {
  readonly id: string;
  /** Canonical name. */
  readonly name: string;
  /** Localized name, or the canonical name when no translation exists. */
  readonly displayName: string;
  /** True when `displayName` comes from a translation. */
  readonly translated: boolean;
}

export interface Model {
  readonly id: string;
  readonly makeId: string;
  readonly name: string;
  readonly displayName: string;
  readonly translated: boolean;
}

export interface SearchOptions {
  /** Maximum number of results. Omit for no limit. */
  limit?: number;
}

export interface ModelSearchOptions extends SearchOptions {
  /** Restrict results to one make. An unknown make yields no results. */
  makeId?: string;
}

export interface Catalog {
  readonly locale: string | undefined;
  getMakes(): Make[];
  getModels(makeId: string): Model[];
  getMake(id: string): Make | undefined;
  getModel(id: string): Model | undefined;
  searchMakes(query: string, options?: SearchOptions): Make[];
  searchModels(query: string, options?: ModelSearchOptions): Model[];
}
