# car-catalog-i18n

[![npm](https://img.shields.io/npm/v/car-catalog-i18n)](https://www.npmjs.com/package/car-catalog-i18n)
[![license](https://img.shields.io/badge/license-MIT%20%2B%20CC0-blue)](LICENSE)

Linked car makes and models with multilingual names and search helpers.
Framework-independent, zero runtime dependencies, works in Node.js and browsers.
English canonical names, Arabic translations included, other languages welcome.

[العربية](README.ar.md)

> **Status: early release (0.x).** The seed dataset is small and the Arabic translations have
> **not yet been reviewed by a fluent reviewer**. See [coverage](docs/COVERAGE.md)
> for exactly what is included. This package does not claim complete coverage.

## Install

```sh
npm install car-catalog-i18n
```

## Usage

```ts
import { createCatalog } from "car-catalog-i18n";
import ar from "car-catalog-i18n/locales/ar";

const catalog = createCatalog({ locale: "ar", translations: ar });

catalog.getMakes();                    // all makes, sorted by display name
catalog.getModels("toyota");           // models of one make
catalog.getMake("toyota");             // Make | undefined
catalog.getModel("toyota/camry");      // Model | undefined

catalog.searchMakes("تويو");
catalog.searchModels("كامري", { makeId: "toyota", limit: 20 });
```

A result looks like:

```ts
{ id: "toyota/camry", makeId: "toyota", name: "Camry", displayName: "كامري", translated: true }
```

`name` is the canonical name, `displayName` is what to show. When no translation
exists, `displayName` equals `name` and `translated` is `false`.

CommonJS:

```js
const { createCatalog } = require("car-catalog-i18n");
const { ar } = require("car-catalog-i18n/locales/ar"); // or .default
```

### API

| Function | Behavior |
|---|---|
| `createCatalog({ locale?, translations? })` | Independent instance; no global language state, safe for concurrent server requests |
| `getMakes()` | All makes with localized names |
| `getModels(makeId)` | Models of a make; `[]` for an unknown make |
| `getMake(id)` / `getModel(id)` | The record, or `undefined` |
| `searchMakes(query, { limit? })` | Ranked search |
| `searchModels(query, { makeId?, limit? })` | Ranked search, optionally within one make |

- An empty query returns the full list (subject to `limit`).
- Records are frozen and lists are fresh arrays, so consumers cannot mutate internal data.
- `limit` must be a non-negative integer, otherwise a `RangeError` is thrown.

### Search

Matches canonical names, localized names and both kinds of aliases. Results are
ranked exact → prefix → partial, then by display name. Matching ignores case,
extra whitespace, hyphens, Latin accents, Arabic diacritics and tatweel, and
folds alef variants (أ إ آ ٱ → ا). Display names are never altered. There is no
fuzzy matching; common alternative spellings are explicit aliases.

### Raw data

```ts
import makes from "car-catalog-i18n/data/makes.json";
import models from "car-catalog-i18n/data/models.json";
import ar from "car-catalog-i18n/locales/ar.json";
```

IDs are stable: makes look like `toyota`, models like `toyota/land-cruiser`.

## Bundle size

Locales are loaded explicitly, so unused languages are never bundled. The
catalog data is embedded in the main entry. Measured for 0.1.0 (run
`npm run coverage` to reproduce):

| File | Raw | Gzip |
|---|---|---|
| `dist/index.js` (catalog + data) | 38.5 kB | 6.1 kB |
| `dist/locales/ar.js` | 46.2 kB | 5.9 kB |

Size grows with coverage.

## Scope

Passenger-car makes and models only. No years, generations, trims, engines,
specifications, prices, VIN decoding or logos. See [docs/data-policy.md](docs/data-policy.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [translation guide](docs/translation-guide.md).

## Author

Created and maintained by [Nael Awadallah](https://github.com/nael-awadallah).
Issues and pull requests: <https://github.com/nael-awadallah/car-catalog-i18n>.

## Licenses

Code: MIT ([LICENSE](LICENSE)). Data: CC0 for the original seed
([DATA-LICENSE](DATA-LICENSE)); third-party sources are listed in
[ATTRIBUTION.md](ATTRIBUTION.md). Make and model names are trademarks of their owners.
