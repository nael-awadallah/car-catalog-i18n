const ALEF_VARIANTS = /[آأإٱ]/g;
const TATWEEL = /ـ/g;
const SEPARATORS = /[-_‐-―]+/g;
const COMBINING_MARKS = /\p{M}/gu;
const WHITESPACE = /\s+/g;

/**
 * Normalizes text for matching only; display names are never modified.
 *
 * - Unicode NFKD, then drops combining marks (Arabic diacritics, Latin accents)
 * - removes Arabic tatweel
 * - folds alef variants (آ أ إ ٱ) to ا
 * - lowercases, treats hyphens/underscores as spaces, collapses whitespace
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(TATWEEL, "")
    .replace(ALEF_VARIANTS, "ا")
    .toLowerCase()
    .replace(SEPARATORS, " ")
    .replace(WHITESPACE, " ")
    .trim();
}
