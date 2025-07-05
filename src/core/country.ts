import fs from "fs";
import path from "path";
import { defaultLocale } from "../config";
import {
  getLocalizedName,
  normalizeLocale,
  isLocaleSupported,
} from "./localizer";

// Define the type for countries data
interface CountryData {
  [code: string]: { name: string };
}

// Read countries data from JSON file
const countriesPath = path.join(process.cwd(), "data", "countries.json");
const countriesData: CountryData = JSON.parse(
  fs.readFileSync(countriesPath, "utf-8")
);

export function getAllCountries(locale?: string) {
  const useLocale = locale ? normalizeLocale(locale) : defaultLocale;

  return Object.entries(countriesData).map(([code, { name }]) => {
    const localizedName = getLocalizedName(code, useLocale, "region");
    return {
      code,
      name: localizedName || name, // Fallback to English name if localization fails
    };
  });
}

export function getCountryName(code: string, locale?: string): string {
  const useLocale = locale ? normalizeLocale(locale) : defaultLocale;
  const country = countriesData[code];

  if (!country) return "";

  const localizedName = getLocalizedName(code, useLocale, "region");
  return localizedName || country.name; // Fallback to English name
}

/**
 * Get countries filtered by region or language
 */
export function getCountriesByRegion(region: string, locale?: string) {
  const countries = getAllCountries(locale);
  // This is a simplified filter - in a real implementation you'd have region mappings
  return countries.filter((country) => {
    // Add region-based filtering logic here
    return true; // For now, return all countries
  });
}

/**
 * Get countries that speak a specific language
 */
export function getCountriesByLanguage(language: string, locale?: string) {
  const countries = getAllCountries(locale);
  // This is a simplified filter - in a real implementation you'd have language mappings
  return countries.filter((country) => {
    // Add language-based filtering logic here
    return true; // For now, return all countries
  });
}

/**
 * Check if a locale is supported
 */
export function isCountryLocaleSupported(locale: string): boolean {
  return isLocaleSupported(locale);
}
