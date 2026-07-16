# Changelog

## 2.0.0

### Breaking changes

- **`init()` behavior tightened.** The default locale now applies consistently everywhere: state lists previously ignored it (they sorted with the host-default collator and only localized via an explicit per-call locale); now countries **and** states honor it. With no default set, all names are English and lists sort with an English collator (v1 started from an implicit `"en-US"`). `init()` with no argument clears the default.
- **Removed the `/compat` entry point** (the `country-state-city`-style API: `Country`, `State`, `setLocale`, `ICountry`, `IState`). Use the core API; `getState(countryCode, stateCode)` accepts bare subdivision codes (`"CA"`) like the compat layer did, and `getAllStates()` moved into the core.
- **Name misses return `undefined`** instead of `""` (`getCountryName`, `getStateName`).
- **`State` objects include `countryCode`** and are always sorted by localized name; no-locale calls sort with an English collator (previously the host default for states).
- **Removed `isCountryLocaleSupported`** — it was an alias of `isLocaleSupported`.

### New

- `createLocalizedData(locale?)` — locale-bound instance API, independent of the `init()` default (snapshots it at creation time when called without a locale).
- **Bare localized subdivision names.** Admin-type words are now stripped from the localized layers the same way they already were from English base names: `es`/`fr`/`it`/`de`/`pt`/`ar` prefix forms like "Prefectura de Aomori" → "Aomori", "État de New York" → "New York", "محافظة القاهرة" → "القاهرة". The same collision guards apply (e.g. "Provincia de Buenos Aires" keeps its type word next to the city "Buenos Aires"), and generic remainders are kept ("Province du Nord"). Russian ("Московская область") and Chinese ("广东省") keep their natural forms, where the type word is integral to the name. Entries that become identical to the English base are dropped from the data (~100 KB smaller bundle).
- `getCountry(code, locale?)`, `getState(countryCode, stateCode, locale?)` (accepts `"CA"` or `"US-CA"`), `getAllStates(locale?)`.
- **CommonJS support**: `require("localized-countries-states")` now works (dual ESM/CJS build).

### Unchanged

- The country/subdivision set and codes, the localization fallback order (bundled language → `Intl.DisplayNames` → English base), sorting of result lists, and all locale utilities (`parseLocale`, `normalizeLocale`, `getFallbackLocales`, `createLocalizer`, `getLocalizedName`, `isLocaleSupported`, `COMMON_LOCALES`).

## 1.2.0 and earlier

See git history.
