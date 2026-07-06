# localized-countries-states

ISO 3166-1 countries and official ISO 3166-2 states/provinces with localized names in 12 languages. Works in Node.js, browsers (React, Next.js, Vite), and edge runtimes from a single entry point — no runtime dependencies, no `fs`, no network.

## Features

- Complete ISO 3166-1 country list (~250 countries/territories)
- Complete official ISO 3166-2 subdivisions — ~5,070 across 200 countries, keyed by full ISO code (`ES-AN`, `US-CA`)
- Subdivision names localized in 12 languages: English, Russian, German, French, Spanish, Chinese, Hindi, Portuguese, Japanese, Arabic, Italian, Hebrew
- Country names in the same 12 languages, with `Intl.DisplayNames` as a runtime fallback for other locales
- BCP 47 locale parsing, validation, and normalization with a fallback chain
- Default locale set once via `init()`, overridable per call

Country/subdivision data is generated from MIT-licensed sources — see [NOTICE.md](./NOTICE.md). Regenerate with `npm run build:data`.

## Installation

```sh
npm install localized-countries-states
```

## Usage

```ts
import { init, getAllCountries, getStatesOfCountry } from 'localized-countries-states';

init('fr-FR');

getAllCountries();
// [{ code: 'DE', name: 'Allemagne' }, { code: 'PK', name: 'Pakistan' }, ...]

getStatesOfCountry('US');
// [{ code: 'US-CA', name: 'California' }, { code: 'US-NY', name: 'New York' }, ...]
```

Every function also accepts a locale directly:

```ts
import { getStatesOfCountry, getStateName, getCountryName } from 'localized-countries-states';

getStatesOfCountry('US', 'es-ES');
// [{ code: 'US-NY', name: 'Nueva York' }, ...]

getStateName('US', 'US-CA', 'ru');   // "Калифорния"
getCountryName('DE', 'fr-FR');       // "Allemagne"
```

## Drop-in replacement for `country-state-city`

The `Country` / `State` API is available from both the main entry and the `/compat` entry point, with the same `{ isoCode, name, countryCode }` shape and bare state codes (`CA`, not `US-CA`). Migration is a one-line import change:

```ts
// before
import { Country, State } from "country-state-city";
// after
import { Country, State } from "localized-countries-states/compat";

Country.getAllCountries();                  // [{ isoCode: 'US', name: 'United States' }, ...]
Country.getCountryByCode("ES");             // { isoCode: 'ES', name: 'Spain' }
State.getStatesOfCountry("US");             // [{ isoCode: 'CA', name: 'California', countryCode: 'US' }, ...]
State.getStateByCodeAndCountry("CA", "US"); // { isoCode: 'CA', name: 'California', countryCode: 'US' }
State.getAllStates();                       // every subdivision
```

Unlike `country-state-city`, every method takes an optional BCP-47 locale, or call `setLocale()` once:

```ts
import { Country, State, setLocale } from "localized-countries-states/compat";

Country.getCountryByCode("FR", "es-ES");    // { isoCode: 'FR', name: 'Francia' }
setLocale("de-DE");
State.getStatesOfCountry("ES");             // Catalonia -> 'Katalonien', etc.
```

Differences:

- No `City` — this package has no city data. Code that uses `City.getCitiesOfState` cannot migrate.
- No `phonecode` / `currency` / `flag` / coordinates on results — only `isoCode`, `name`, `countryCode`.
- Data is bundled eagerly (~1.2 MB raw, ~250 KB gzipped, no cities).

## API Reference

### Core

- `init(locale: string): void` — set the default locale
- `getAllCountries(locale?: string): { code: string; name: string }[]`
- `getStatesOfCountry(countryCode: string, locale?: string): { code: string; name: string }[]`
- `getCountryName(code: string, locale?: string): string`
- `getStateName(countryCode: string, stateCode: string, locale?: string): string`

### Availability helpers

- `getAvailableStateLocales(countryCode: string): string[]`
- `hasLocalizedStates(countryCode: string, locale?: string): boolean`
- `getAvailableCountryLocales(): string[]`
- `hasLocalizedCountries(locale?: string): boolean`
- `isCountryLocaleSupported(locale: string): boolean`

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

## Testing

```sh
npm test
```

## License

Package code: ISC. Bundled country/subdivision data is generated from MIT-licensed sources (`iso-3166` and `esosedi/3166`) — see [NOTICE.md](./NOTICE.md) for full attribution.
