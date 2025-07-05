Absolutely. Here's the **updated and developer-ready technical specification** for your package with the newly added `init(locale)` method and support for localized country and state names, following ISO and BCP 47 standards.

---

# 🌍 Tech Spec: `country-localizer` Package

## 📘 Overview

The `country-localizer` package provides:

* A list of all **countries** (ISO 3166-1 alpha-2).
* A list of **states/provinces** per country (ISO 3166-2).
* **Localized names** using the **BCP 47 locale format** (e.g., `en-US`, `fr-FR`, `ar-BH`).
* A one-time `init(locale)` setup for default localization.
* Works in **Node.js** and **browsers** (ESM/CJS compatible).
* **No legal issues**: uses open/public domain data and native APIs.

---

## ✅ Core Features

| Feature                            | Included |
| ---------------------------------- | -------- |
| ISO 3166-1 Country Codes           | ✅        |
| ISO 3166-2 State/Province Codes    | ✅        |
| Localized Country Names            | ✅        |
| State Names (English only for now) | ✅        |
| One-time Locale Initialization     | ✅        |
| Locale Override per Function       | ✅        |
| Full TypeScript Support            | ✅        |
| No Runtime Dependencies            | ✅        |

---

## 📦 Public API

```ts
// Sets the default locale for the package
init(locale: string): void;

// Get all countries in default or specified locale
getAllCountries(locale?: string): { code: string; name: string }[];

// Get all states/provinces of a country (names currently in English)
getStatesOfCountry(countryCode: string): { code: string; name: string }[];

// Get localized name for a single country
getCountryName(code: string, locale?: string): string;
```

---

## 🧱 Data Source and Format

### ✅ Countries (`data/countries.json`)

```json
{
  "PK": { "name": "Pakistan" },
  "DE": { "name": "Germany" }
}
```

### ✅ States (`data/states/PK.json`)

```json
{
  "PB": "Punjab",
  "SD": "Sindh"
}
```

---

## 🧠 Internal Locale Management

### `src/config.ts`

```ts
export let defaultLocale = 'en-US';

export const setDefaultLocale = (locale: string) => {
  defaultLocale = locale;
};
```

---

## 🔧 Internal Logic

### `getAllCountries(locale?: string)`

* Uses `Intl.DisplayNames` if available.
* Fallbacks to English name from JSON.

```ts
const localizer = new Intl.DisplayNames([locale], { type: 'region' });
localizer.of('PK'); // => "Pakistan" or localized name
```

---

## 📁 Folder Structure

```
country-localizer/
├── data/
│   ├── countries.json
│   └── states/
│       ├── PK.json
│       └── DE.json
├── src/
│   ├── config.ts
│   ├── index.ts         // public API
│   └── core/
│       ├── country.ts   // core logic
│       ├── state.ts
│       └── localizer.ts
├── tests/
│   └── core.test.ts
├── package.json
└── README.md
```

---

## 🧪 Test Coverage

Use `Jest` or `Vitest`.

### Example Tests

* `getAllCountries('fr-FR')` → returns French names.
* `getStatesOfCountry('PK')` → returns correct states.
* `init('ar-BH')` + `getAllCountries()` → uses Arabic names.
* Invalid locales fallback to `en-US`.

---

## 🔐 Licensing and Legal Safety

| Dataset         | License          |
| --------------- | ---------------- |
| ISO Codes       | Public Domain    |
| CLDR / Intl API | Unicode / native |
| No scraping     | ✅ Safe           |

---

## 🛠️ Future Roadmap

| Feature                      | Status                           |
| ---------------------------- | -------------------------------- |
| Localized state names        | 🔜 Optional (via CLDR if needed) |
| Country flags (emoji)        | 🔜 Optional                      |
| Spoken languages per country | ❌ Out of Scope                   |
| Region filtering (e.g., EU)  | 🔜 Optional                      |

---

## 🧑‍💻 Sample Usage

```ts
import { init, getAllCountries, getStatesOfCountry } from 'country-localizer';

init('fr-FR');

const countries = getAllCountries();
console.log(countries);
// [{ code: 'DE', name: 'Allemagne' }, { code: 'PK', name: 'Pakistan' }]

const states = getStatesOfCountry('PK');
console.log(states);
// [{ code: 'PB', name: 'Punjab' }, { code: 'SD', name: 'Sindh' }]
```

---

Let me know if you want me to generate the initial boilerplate code or setup a GitHub repo structure for your junior developer.
