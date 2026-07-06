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
} from "./dist/index.js";

init("fr-FR");

const countries = getAllCountries();
console.log(`${countries.length} countries, default locale fr-FR:`);
for (const c of countries.slice(0, 5)) console.log(`  ${c.code}  ${c.name}`);

console.log("\nCountry names per locale:");
for (const locale of ["es-ES", "de-DE", "zh-CN", "ar-SA", "ru-RU"]) {
  console.log(`  US in ${locale}: ${getCountryName("US", locale)}`);
}

console.log("\nUS states in Spanish:");
for (const s of getStatesOfCountry("US", "es-ES").slice(0, 5)) {
  console.log(`  ${s.code}  ${s.name}`);
}

console.log("\nSingle lookups:");
console.log(`  getStateName("US", "US-CA", "ru") -> ${getStateName("US", "US-CA", "ru")}`);
console.log(`  getStateName("DE", "DE-BY", "fr") -> ${getStateName("DE", "DE-BY", "fr")}`);

console.log("\nLocale utilities:");
console.log(`  normalizeLocale("en-us") -> ${normalizeLocale("en-us")}`);
console.log(`  parseLocale("zh-Hans-CN") ->`, parseLocale("zh-Hans-CN"));
console.log(`  hasLocalizedStates("US", "es-ES") -> ${hasLocalizedStates("US", "es-ES")}`);
console.log(`  getAvailableStateLocales("US") -> ${getAvailableStateLocales("US").join(", ")}`);
