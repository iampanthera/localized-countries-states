import {
  init,
  getAllCountries,
  getStatesOfCountry,
  getCountryName,
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
  normalizeLocale,
  parseLocale,
  isLocaleSupported,
  COMMON_LOCALES,
} from "./dist/index.js";

console.log("🌍 Enhanced Country Localizer Demo\n");

// Initialize with French locale
init("fr-FR");
console.log("📋 All Countries (French):");
const countries = getAllCountries();
console.log(`Total countries: ${countries.length}`);
console.log("Sample countries:");
countries.slice(0, 5).forEach((c) => console.log(`  ${c.code}: ${c.name}`));
console.log();

// Get US states with localization
console.log("🇺🇸 US States (English):");
const usStates = getStatesOfCountry("US");
console.log(`Total states: ${usStates.length}`);
console.log("Sample states:");
usStates.slice(0, 5).forEach((s) => console.log(`  ${s.code}: ${s.name}`));
console.log();

// Get US states in Spanish
console.log("🇺🇸 US States (Spanish):");
const usStatesSpanish = getStatesOfCountry("US", "es-ES");
console.log("Sample states in Spanish:");
usStatesSpanish
  .slice(0, 5)
  .forEach((s) => console.log(`  ${s.code}: ${s.name}`));
console.log();

// Get US states in French
console.log("🇺🇸 US States (French):");
const usStatesFrench = getStatesOfCountry("US", "fr-FR");
console.log("Sample states in French:");
usStatesFrench
  .slice(0, 5)
  .forEach((s) => console.log(`  ${s.code}: ${s.name}`));
console.log();

// Test individual state names
console.log("🏛️ Individual State Names:");
console.log(`California in Spanish: ${getStateName("US", "CA", "es-ES")}`);
console.log(`New York in French: ${getStateName("US", "NY", "fr-FR")}`);
console.log(`Texas in English: ${getStateName("US", "TX")}`);
console.log();

// Test locale utilities
console.log("🔧 Locale Utilities:");
console.log(`Normalized 'en-us': ${normalizeLocale("en-us")}`);
console.log(`Normalized 'FR-fr': ${normalizeLocale("FR-fr")}`);
console.log(`Parsed 'zh-Hans-CN':`, parseLocale("zh-Hans-CN"));
console.log(`Is 'fr-FR' supported: ${isLocaleSupported("fr-FR")}`);
console.log(
  `Is 'invalid-locale' supported: ${isLocaleSupported("invalid-locale")}`
);
console.log();

// Test localization availability
console.log("📊 Localization Availability:");
console.log(
  `US states available in Spanish: ${hasLocalizedStates("US", "es-ES")}`
);
console.log(
  `US states available in French: ${hasLocalizedStates("US", "fr-FR")}`
);
console.log(
  `US states available in German: ${hasLocalizedStates("US", "de-DE")}`
);
console.log(
  `Available locales for US states: ${getAvailableStateLocales("US").join(
    ", "
  )}`
);
console.log();

// Test different locales for countries
console.log("🌐 Country Localization Examples:");
console.log(`Germany in French: ${getCountryName("DE", "fr-FR")}`);
console.log(`Germany in Spanish: ${getCountryName("DE", "es-ES")}`);
console.log(`Germany in Arabic: ${getCountryName("DE", "ar-SA")}`);
console.log(`Germany in Japanese: ${getCountryName("DE", "ja-JP")}`);
console.log(`Germany in Chinese: ${getCountryName("DE", "zh-CN")}`);
console.log();

// Test Brazil in different locales
console.log("🇧🇷 Brazil in different locales:");
console.log(`English: ${getCountryName("BR", "en-US")}`);
console.log(`Portuguese: ${getCountryName("BR", "pt-BR")}`);
console.log(`Spanish: ${getCountryName("BR", "es-ES")}`);
console.log(`French: ${getCountryName("BR", "fr-FR")}`);
console.log();

// Show common locales
console.log("🌍 Common Supported Locales (sample):");
console.log(COMMON_LOCALES.slice(0, 10).join(", "));
console.log(`... and ${COMMON_LOCALES.length - 10} more`);
console.log();

// Test Canadian provinces
console.log("🇨🇦 Canadian Provinces:");
const caProvinces = getStatesOfCountry("CA");
console.log(`Total provinces: ${caProvinces.length}`);
caProvinces.forEach((p) => console.log(`  ${p.code}: ${p.name}`));
console.log();

// Test Indian states
console.log("🇮🇳 Indian States (sample):");
const inStates = getStatesOfCountry("IN");
console.log(`Total states: ${inStates.length}`);
console.log("Sample states:");
inStates.slice(0, 5).forEach((s) => console.log(`  ${s.code}: ${s.name}`));
console.log();
