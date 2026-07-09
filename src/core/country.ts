import { defaultLocale } from "../config.js";
import {
  getLocalizedName,
  normalizeLocale,
  isLocaleSupported,
} from "./localizer.js";
import {
  COUNTRIES as countriesData,
  COUNTRIES_LOCALIZED as localizedCountriesData,
} from "../../data/bundle.js";

export function getAllCountries(locale?: string) {
  const useLocale = locale ? normalizeLocale(locale) : defaultLocale;
  const collator = new Intl.Collator(useLocale);

  return Object.entries(countriesData)
    .map(([code, { name }]) => {
      let localizedName = "";

      if (
        localizedCountriesData[useLocale] &&
        localizedCountriesData[useLocale][code]
      ) {
        localizedName = localizedCountriesData[useLocale][code];
      } else if (useLocale.includes("-")) {
        const language = useLocale.split("-")[0];
        if (
          localizedCountriesData[language] &&
          localizedCountriesData[language][code]
        ) {
          localizedName = localizedCountriesData[language][code];
        }
      }

      if (!localizedName) {
        localizedName = getLocalizedName(code, useLocale, "region");
      }

      return {
        code,
        name: localizedName || name,
      };
    })
    .sort((a, b) => collator.compare(a.name, b.name));
}

export function getCountryName(code: string, locale?: string): string {
  const useLocale = locale ? normalizeLocale(locale) : defaultLocale;
  const country = countriesData[code];

  if (!country) return "";

  let localizedName = "";

  if (
    localizedCountriesData[useLocale] &&
    localizedCountriesData[useLocale][code]
  ) {
    localizedName = localizedCountriesData[useLocale][code];
  } else if (useLocale.includes("-")) {
    const language = useLocale.split("-")[0];
    if (
      localizedCountriesData[language] &&
      localizedCountriesData[language][code]
    ) {
      localizedName = localizedCountriesData[language][code];
    }
  }

  if (!localizedName) {
    localizedName = getLocalizedName(code, useLocale, "region");
  }

  return localizedName || country.name;
}

/**
 * Check if a locale is supported
 */
export function isCountryLocaleSupported(locale: string): boolean {
  return isLocaleSupported(locale);
}

/**
 * Get all available locales for country names
 */
export function getAvailableCountryLocales(): string[] {
  return Object.keys(localizedCountriesData);
}

/**
 * Check if localized country names are available for a locale
 */
export function hasLocalizedCountries(locale?: string): boolean {
  if (!locale) return false;

  const normalizedLocale = normalizeLocale(locale);
  return !!(
    localizedCountriesData[normalizedLocale] ||
    (normalizedLocale.includes("-") &&
      localizedCountriesData[normalizedLocale.split("-")[0]])
  );
}
