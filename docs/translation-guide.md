# Translation guide

Locale files live in `locales/<code>.json`:

```json
{
  "makes":  { "toyota": { "name": "تويوتا", "aliases": [] } },
  "models": { "toyota/land-cruiser": { "name": "لاند كروزر", "aliases": ["لاندكروزر"] } }
}
```

Keys are canonical IDs. Translating a subset is fine; the rest falls back to the canonical name.

## Principles

- **Transliterate**, don't translate literal meaning (`Land Cruiser` → `لاند كروزر`).
- Prefer the form most used in the target region.
- Preserve meaningful numbers and letters (`CX-5` → `سي إكس 5`, `Model 3` → `موديل 3`).
  Pure-number models (`911`, `208`) can be left untranslated.
- Put other common spellings in `aliases` (`لاندكروزر`, `رنج روفر`). Search already
  folds alef variants and ignores diacritics/tatweel, so don't add aliases that differ only by those.
- Display `name` should use the preferred spelling with correct hamza (`أودي`, `إكس`).

## Review

A fluent reviewer must approve translations before they are published. Keep
unreviewed machine suggestions out of `locales/`. The initial Arabic file is
**pending such a review**; `docs/sources.json` tracks this (`arabicReviewed`).

## Adding a language

1. Create `locales/<code>.json`; `npm run validate` checks it automatically.
2. Add `src/locales/<code>.ts` (copy `ar.ts`), an entry in `tsup.config.ts`, and
   `exports` entries in `package.json` (copy `./locales/ar`).
3. Add tests mirroring the Arabic ones where the language has special search needs
   (extend `src/normalize.ts` only for rules that are safe for all languages).
4. Run `npm run coverage` and commit `docs/COVERAGE.md`.
