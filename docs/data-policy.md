# Data policy

## Scope

Passenger cars (including SUVs, pickups and vans sold as passenger vehicles).
Excluded for now: motorcycles, trucks/buses, model years, generations, trims,
engines, specifications, prices, VIN decoding, logos.

## Canonical names

Use the internationally recognized brand/model spelling (`Land Cruiser`, `X-Trail`,
`Mercedes-Benz`). Name and aliases must be non-blank.

## Models vs. trims vs. series

- **A model** is a name a buyer would pick in a selector and that persists across
  generations: `Camry`, `Corolla`, `3 Series`, `Model 3`.
- **Not models:** trims (`Camry SE`, `Civic Si`), engine/power variants (`M340i`),
  body styles of the same line (`Corolla Sedan`), and facelift/"Pro" suffixes
  (`Tiggo 7 Pro` → alias of `Tiggo 7`).
- **Separate models** when the manufacturer sells them as different products,
  even if related: `Corolla` and `Corolla Cross`, `Range Rover` and `Range Rover Sport`.
- **Series naming:** BMW/Mercedes families are listed as the series/class
  (`3 Series`, `C-Class`); distinct product lines such as `X5`, `GLC` are models.

## Data quality

Models are filtered by popularity and cleaned of obvious trims and malformed rows, but
not audited one by one. Report mistakes as issues; fixes that keep IDs are patch releases.

## Spelling and regional names

Never create a model just because spelling differs; add an alias. Merge regional
names (`Cerato`/`Forte`/`K3`, `Pajero`/`Montero`) only when verified to be the
same model, and keep the other names as aliases.

## IDs

Stable and never reused. IDs are generated once from the canonical name
(`make-slug` / `make-slug/model-slug`) and do not change when names change.
When duplicates are merged, record old → surviving ID in `docs/id-mappings.json`
(none yet) and keep the old ID documented.

## Fallback

Missing translations fall back to the canonical name. Incomplete locales are allowed.

## Provenance

`docs/sources.json` records every external import (URL, version, retrieval date,
license). Provenance is not repeated in runtime results.

## Versioning

The dataset is versioned with the package.

- **Patch:** corrections and translations that keep meaning and IDs.
- **Minor:** new makes, models, languages or backward-compatible functions.
- **Major:** incompatible API/schema changes or removal of public IDs.

## ID stability

- A make or model ID is permanent within a major version: it is never renamed,
  reused for a different vehicle or removed. `tests/ids.snapshot.json` records every
  published ID and the test suite fails if one disappears.
- A wrong or duplicate record is not deleted. Keep its ID, and move its names to the
  surviving record as aliases (removal is a major change).
- Adding IDs is a minor change. After adding records, run `npm run ids:update`
  and commit the refreshed snapshot.
- Search keys (names and aliases after normalization) must not collide inside a make,
  or among makes. `npm run validate` enforces this; the few historical exceptions are
  listed in `scripts/lib/data.mjs`.
