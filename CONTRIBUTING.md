# Contributing

Thanks for helping. Every change goes through a pull request; CI must pass.

## Setup

```sh
npm ci
npm run check   # typecheck, data validation, tests, build, packed-artifact smoke test
```

## What you can contribute

| Change | Edit | Evidence required |
|---|---|---|
| Add a make or model | `data/makes.json`, `data/models.json` | A link to the manufacturer's page or an official register showing the model in a market |
| Fix a name or relationship | same | Same |
| Add or fix a translation / alias | `locales/<code>.json` | Native-speaker confidence; see [translation guide](docs/translation-guide.md) |
| Add a language | new `locales/<code>.json` + `src/locales/<code>.ts` + entries in `tsup.config.ts` and `package.json` `exports` (copy the `ar` ones) | A fluent reviewer |
| Report a missing regional model | open an issue | Same evidence as adding |

Rules (enforced by `npm run validate`):

- IDs are lowercase slugs: `toyota`, `toyota/land-cruiser`. **Never change or reuse a published ID.**
- Every model's `makeId` exists and its ID starts with `<makeId>/`.
- Names and aliases are non-blank. Locale files reference existing IDs only.
- Don't add a second model for a spelling variant; add an alias. Read [docs/data-policy.md](docs/data-policy.md) for models vs. trims.

Keep `docs/COVERAGE.md` current by running `npm run coverage` and committing the result.

## Importing a dataset

Only datasets with verified provenance and compatible redistribution terms.
Use `scripts/import.mjs` (dry run by default; `--write` records provenance in
`docs/sources.json`), then update `ATTRIBUTION.md` and `DATA-LICENSE`.

## Releasing (maintainers)

1. Update `CHANGELOG.md`, regenerate `docs/COVERAGE.md`, bump `version` (see data-policy versioning).
2. Push a tag `vX.Y.Z`; the Release workflow validates and publishes.
