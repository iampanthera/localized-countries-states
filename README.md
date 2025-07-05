# country-localizer

A comprehensive TypeScript package for ISO country and state/province lists with advanced localization support (BCP 47 locale), supporting Node.js and browsers.

## 🌟 Features
- **Complete ISO 3166-1 country codes** (all ~200 countries)
- **ISO 3166-2 state/province codes** for major countries
- **Advanced localization** via native `Intl.DisplayNames` API
- **Localized state/province names** (Spanish, French, and more)
- **Smart fallback system** with locale normalization
- **BCP 47 locale validation** and parsing
- **One-time locale initialization**
- **Locale override per function**
- **No runtime dependencies**

## 🌍 Supported Countries with States/Provinces
- 🇺🇸 **United States** (50 states + territories) - *Localized in Spanish & French*
- 🇨🇦 **Canada** (13 provinces/territories)
- 🇮🇳 **India** (36 states/union territories)
- 🇧🇷 **Brazil** (27 states)
- 🇦🇺 **Australia** (8 states/territories)
- 🇨🇳 **China** (34 provinces/regions)
- 🇬🇧 **United Kingdom** (4 countries)
- 🇫🇷 **France** (13 regions)
- 🇮🇹 **Italy** (20 regions)
- 🇪🇸 **Spain** (17 autonomous communities)
- 🇷🇺 **Russia** (85 federal subjects)
- 🇲🇽 **Mexico** (32 states)
- 🇯🇵 **Japan** (47 prefectures)
- 🇵🇰 **Pakistan** (provinces)
- 🇩🇪 **Germany** (states)

## 🚀 Installation
```sh
npm install country-localizer
```

## 📖 Usage

### Basic Usage
```ts
import { init, getAllCountries, getStatesOfCountry } from 'country-localizer';

init('fr-FR');

const countries = getAllCountries();
console.log(countries);
// [{ code: 'DE', name: 'Allemagne' }, { code: 'PK', name: 'Pakistan' }]

const states = getStatesOfCountry('US');
console.log(states);
// [{ code: 'CA', name: 'California' }, { code: 'NY', name: 'New York' }]
```

### Advanced Localization
```ts
import { 
  getAllCountries, 
  getStatesOfCountry, 
  getStateName,
  normalizeLocale,
  parseLocale,
  isLocaleSupported 
} from 'country-localizer';

// Get countries in Spanish
const spanishCountries = getAllCountries('es-ES');

// Get US states in Spanish
const spanishStates = getStatesOfCountry('US', 'es-ES');
// [{ code: 'CA', name: 'California' }, { code: 'NY', name: 'Nueva York' }]

// Get individual state names
const stateName = getStateName('US', 'CA', 'es-ES'); // "California"

// Locale utilities
const normalized = normalizeLocale('en-us'); // "en-US"
const parsed = parseLocale('zh-Hans-CN'); // { language: 'zh', script: 'Hans', region: 'CN' }
const supported = isLocaleSupported('fr-FR'); // true
```

## 🔧 API Reference

### Core Functions
- `init(locale: string): void` — Set default locale
- `getAllCountries(locale?: string): { code: string; name: string }[]`
- `getStatesOfCountry(countryCode: string, locale?: string): { code: string; name: string }[]`
- `getCountryName(code: string, locale?: string): string`

### Enhanced Localization
- `getStateName(countryCode: string, stateCode: string, locale?: string): string`
- `getAvailableStateLocales(countryCode: string): string[]`
- `hasLocalizedStates(countryCode: string, locale?: string): boolean`
- `getCountriesByRegion(region: string, locale?: string): { code: string; name: string }[]`
- `getCountriesByLanguage(language: string, locale?: string): { code: string; name: string }[]`
- `isCountryLocaleSupported(locale: string): boolean`

### Locale Utilities
- `parseLocale(locale: string): LocaleInfo | null` — Parse BCP 47 locale
- `normalizeLocale(locale: string): string` — Normalize locale format
- `getFallbackLocales(locale: string): string[]` — Get fallback chain
- `createLocalizer(locale: string, type?: string): Intl.DisplayNames | null`
- `getLocalizedName(code: string, locale: string, type?: string): string`
- `isLocaleSupported(locale: string): boolean` — Check locale support
- `COMMON_LOCALES: readonly string[]` — List of commonly supported locales

### Types
- `LocaleInfo` — Parsed locale information

## 🌐 Supported Locales
The package supports **50+ locales** including:
- **English**: en-US, en-GB, en-CA, en-AU
- **Spanish**: es-ES, es-MX, es-AR, es-CO
- **French**: fr-FR, fr-CA, fr-BE, fr-CH
- **German**: de-DE, de-AT, de-CH, de-LU
- **Portuguese**: pt-BR, pt-PT
- **Chinese**: zh-CN, zh-TW, zh-HK
- **Japanese**: ja-JP
- **Korean**: ko-KR
- **Arabic**: ar-SA, ar-EG, ar-AE
- **Hindi**: hi-IN
- **Russian**: ru-RU, ru-UA
- And many more...

## 🧪 Testing
```sh
npm test
```

## 📊 Localization Features

### Smart Fallback System
- **Exact match**: `es-ES` → Spanish (Spain)
- **Language fallback**: `es-MX` → Spanish (Mexico) → Spanish → English
- **Region fallback**: `en-CA` → English (Canada) → English (US) → English
- **Graceful degradation**: Always falls back to English names

### State/Province Localization
Currently supports localized state names for:
- 🇺🇸 **United States**: Spanish (es-ES), French (fr-FR)
- More countries coming soon...

### BCP 47 Compliance
- Full BCP 47 locale format support
- Language, script, region, and variant parsing
- Locale validation and normalization
- Fallback chain generation

## 🔄 Migration from v1
The API is fully backward compatible. New features are additive:
```ts
// Old way (still works)
const states = getStatesOfCountry('US');

// New way with localization
const states = getStatesOfCountry('US', 'es-ES');
```

## 📝 License
Public domain data. Uses native APIs. 