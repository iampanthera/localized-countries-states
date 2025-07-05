import {
  init,
  getAllCountries,
  getStatesOfCountry,
  getCountryName,
} from "./dist/index.js";

console.log("🌍 Country Localizer Demo\n");

// Initialize with French locale
init("fr-FR");
console.log("📋 All Countries (French):");
const countries = getAllCountries();
console.log(`Total countries: ${countries.length}`);
console.log("Sample countries:");
countries.slice(0, 5).forEach((c) => console.log(`  ${c.code}: ${c.name}`));
console.log();

// Get US states
console.log("🇺🇸 US States:");
const usStates = getStatesOfCountry("US");
console.log(`Total states: ${usStates.length}`);
console.log("Sample states:");
usStates.slice(0, 5).forEach((s) => console.log(`  ${s.code}: ${s.name}`));
console.log();

// Get Canadian provinces
console.log("🇨🇦 Canadian Provinces:");
const caProvinces = getStatesOfCountry("CA");
console.log(`Total provinces: ${caProvinces.length}`);
caProvinces.forEach((p) => console.log(`  ${p.code}: ${p.name}`));
console.log();

// Get Indian states
console.log("🇮🇳 Indian States (sample):");
const inStates = getStatesOfCountry("IN");
console.log(`Total states: ${inStates.length}`);
console.log("Sample states:");
inStates.slice(0, 5).forEach((s) => console.log(`  ${s.code}: ${s.name}`));
console.log();

// Test localization
console.log("🌐 Localization Examples:");
console.log(`Germany in French: ${getCountryName("DE", "fr-FR")}`);
console.log(`Germany in Spanish: ${getCountryName("DE", "es-ES")}`);
console.log(`Germany in Arabic: ${getCountryName("DE", "ar-SA")}`);
console.log(`Germany in Japanese: ${getCountryName("DE", "ja-JP")}`);
console.log();

// Test different locales
console.log("🇧🇷 Brazil in different locales:");
console.log(`English: ${getCountryName("BR", "en-US")}`);
console.log(`Portuguese: ${getCountryName("BR", "pt-BR")}`);
console.log(`Spanish: ${getCountryName("BR", "es-ES")}`);
console.log(`French: ${getCountryName("BR", "fr-FR")}`);
