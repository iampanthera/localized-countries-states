# localized-countries-states

ISO 3166-1 countries and official ISO 3166-2 states/provinces with localized names in 12 languages. Works in Node.js (ESM **and** CommonJS), browsers (React, Next.js, Vite), and edge runtimes, with no runtime dependencies, no `fs`, and no network calls.

## Features

- Complete ISO 3166-1 country list (~250 countries/territories)
- Complete official ISO 3166-2 subdivisions: ~5,070 across 200 countries, keyed by full ISO code (`ES-AN`, `US-CA`)
- Subdivision names localized in 12 languages: English, Russian, German, French, Spanish, Chinese, Hindi, Portuguese, Japanese, Arabic, Italian, Hebrew
- Country names in the same 12 languages, with `Intl.DisplayNames` as a runtime fallback for other locales
- BCP 47 locale parsing, validation, and normalization with a fallback chain
- Flexible locale handling: set a site-wide default once with `init()`, pass a locale per call, or bind one with `createLocalizedData()`

Country/subdivision data is generated from MIT-licensed sources; see [NOTICE.md](./NOTICE.md). Regenerate with `npm run build:data`.

## Installation

```sh
npm install localized-countries-states
```

## Usage

```ts
import {
  getAllCountries,
  getStatesOfCountry,
  getCountryName,
  getState,
} from "localized-countries-states";

getAllCountries("fr-FR");
// [{ code: 'DE', name: 'Allemagne' }, { code: 'PK', name: 'Pakistan' }, ...]

getStatesOfCountry("US", "es-ES");
// [{ code: 'US-NY', countryCode: 'US', name: 'Nueva York' }, ...]

getCountryName("DE", "fr-FR"); // "Allemagne"
getState("US", "CA", "ru"); // { code: 'US-CA', countryCode: 'US', name: 'Калифорния' }
```

Omit the locale for English names. Subdivision lookups accept bare (`"CA"`) or full (`"US-CA"`) codes.

For a site with one locale, set it once at startup — calls that omit the locale then use it (an explicit per-call locale still wins):

```ts
import { init, getAllCountries, getCountryName } from "localized-countries-states";

init("fr-FR");

getAllCountries(); // French names
getCountryName("DE"); // "Allemagne"
getCountryName("DE", "es-ES"); // "Alemania" — per-call override
```

Or bind a locale to an instance (unaffected by `init`, snapshots the default if created without a locale):

```ts
import { createLocalizedData } from "localized-countries-states";

const data = createLocalizedData("fr-FR");
data.getAllCountries(); // French names
data.getStatesOfCountry("US");
data.getCountryName("DE"); // "Allemagne"
```

CommonJS works too:

```js
const { getAllCountries } = require("localized-countries-states");
```

## API Reference

### Default locale

- `init(locale?: string): void` — set the site-wide default used when a call omits `locale`; call with no argument to clear it

### Countries

- `getAllCountries(locale?: string): Country[]` — sorted by localized name
- `getCountry(code: string, locale?: string): Country | undefined`
- `getCountryName(code: string, locale?: string): string | undefined`

### States / subdivisions

- `getStatesOfCountry(countryCode: string, locale?: string): State[]` — sorted by localized name
- `getAllStates(locale?: string): State[]` — every subdivision of every country
- `getState(countryCode: string, stateCode: string, locale?: string): State | undefined`
- `getStateName(countryCode: string, stateCode: string, locale?: string): string | undefined`

```ts
interface Country {
  code: string; // "US"
  name: string; // localized display name
}

interface State {
  code: string; // full ISO 3166-2 code, "US-CA"
  countryCode: string; // "US"
  name: string; // localized display name
}
```

Unknown codes return `undefined` (lookups) or `[]` (lists).

### Locale-bound instance

- `createLocalizedData(locale?: string): LocalizedData` — all of the above with the locale baked in, plus a readonly `locale` property (normalized BCP 47)

### Availability helpers

- `getAvailableCountryLocales(): string[]` — languages the bundled country data covers (e.g. `["ru", "de", ...]`)
- `getAvailableStateLocales(countryCode: string): string[]`
- `hasLocalizedCountries(locale?: string): boolean`
- `hasLocalizedStates(countryCode: string, locale?: string): boolean`

### Locale utilities

- `parseLocale(locale: string): LocaleInfo | null`
- `normalizeLocale(locale: string): string`
- `getFallbackLocales(locale: string): string[]`
- `createLocalizer(locale: string, type?: string): Intl.DisplayNames | null`
- `getLocalizedName(code: string, locale: string, type?: string): string`
- `isLocaleSupported(locale: string): boolean`
- `COMMON_LOCALES: readonly string[]`

## Locales and fallback behavior

Bundled translations cover 12 languages: `en`, `ru`, `de`, `fr`, `es`, `zh`, `hi`, `pt`, `ja`, `ar`, `it`, `he`. Any region variant of these resolves via the language (`es-MX` → `es`).

Name resolution order:

1. Exact locale match in the bundled data (`es-ES`)
2. Language-only match (`es`)
3. For country names: `Intl.DisplayNames` (so unbundled locales like `ko` or `tr` still work at runtime)
4. The English base name

Subdivisions localized upstream are the top-level regions; finer subdivisions (e.g. Spanish provinces) fall back to their canonical name.

Result lists are always sorted by localized name using the locale's collation rules (English collation when no locale is given).

## Migrating from v1

See [CHANGELOG.md](./CHANGELOG.md). In short: the `country-state-city` compat entry point was removed, name misses return `undefined` instead of `""`, `State` objects now include `countryCode`, and `init()`'s default now applies consistently to both countries and states (with no default set, everything is English).

## Development

```sh
npm test          # jest (core + build-pipeline unit tests)
npm run check     # typecheck + lint + format + tests
npm run build     # dual ESM/CJS build via tsup
npm run build:data # regenerate data/bundle.* from sources
```

## License

Package code: ISC. Bundled country/subdivision data is generated from MIT-licensed sources (`iso-3166` and `esosedi/3166`); see [NOTICE.md](./NOTICE.md) for full attribution.
