# country-localizer

A TypeScript package for ISO country and state/province lists with localized country names (BCP 47 locale), supporting Node.js and browsers.

## Features
- **Complete ISO 3166-1 country codes** (all ~200 countries)
- **ISO 3166-2 state/province codes** for major countries
- **Localized country names** (via Intl.DisplayNames)
- **State names** (English only for now)
- **One-time locale initialization**
- **Locale override per function**
- **No runtime dependencies**

## Supported Countries with States/Provinces
- 🇺🇸 United States (50 states + territories)
- 🇨🇦 Canada (13 provinces/territories)
- 🇮🇳 India (36 states/union territories)
- 🇧🇷 Brazil (27 states)
- 🇦🇺 Australia (8 states/territories)
- 🇨🇳 China (34 provinces/regions)
- 🇬🇧 United Kingdom (4 countries)
- 🇫🇷 France (13 regions)
- 🇮🇹 Italy (20 regions)
- 🇪🇸 Spain (17 autonomous communities)
- 🇷🇺 Russia (85 federal subjects)
- 🇲🇽 Mexico (32 states)
- 🇯🇵 Japan (47 prefectures)
- 🇵🇰 Pakistan (provinces)
- 🇩🇪 Germany (states)

## Installation
```sh
npm install country-localizer
```

## Usage
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

## API
- `init(locale: string): void` — Set default locale
- `getAllCountries(locale?: string): { code: string; name: string }[]`
- `getStatesOfCountry(countryCode: string): { code: string; name: string }[]`
- `getCountryName(code: string, locale?: string): string`

## Testing
```sh
npm test
```

## License
Public domain data. Uses native APIs. 