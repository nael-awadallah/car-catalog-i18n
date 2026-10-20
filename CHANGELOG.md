# Changelog

All notable changes are documented here. The dataset is versioned together with
the package; see [docs/data-policy.md](docs/data-policy.md#versioning).

## Unreleased

- Added `getAllModels()`.
- Validation now rejects colliding search keys; ID snapshot test guards against removed IDs
  (see [ID stability](docs/data-policy.md#id-stability)).

## 0.2.0 — 2026-10-20

- Catalog expanded to 88 makes and 1260 models. See [ATTRIBUTION.md](ATTRIBUTION.md) for required credit.
- Data files are now distributed under CC BY 4.0 (attribution required, see DATA-LICENSE).
- Arabic names for all 88 makes and most popular models; consistency review of the Arabic file.
- No existing IDs changed.

## 0.1.0 — 2026-10-20

- Initial seed: 36 makes, 347 models (see [docs/COVERAGE.md](docs/COVERAGE.md)).
- Arabic locale (`car-catalog-i18n/locales/ar`), **not yet reviewed by a fluent reviewer**.
- `createCatalog` with `getMakes`, `getModels`, `getMake`, `getModel`, `searchMakes`, `searchModels`.
- ESM + CommonJS builds, TypeScript declarations, raw JSON exports.
