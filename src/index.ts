import { setDefaultLocale, defaultLocale } from "./config";
import {
  getAllCountries,
  getCountryName,
  getCountriesByRegion,
  getCountriesByLanguage,
  isCountryLocaleSupported,
} from "./core/country";
import {
  getStatesOfCountry,
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
} from "./core/state";
import {
  parseLocale,
  normalizeLocale,
  getFallbackLocales,
  createLocalizer,
  getLocalizedName,
  isLocaleSupported,
  COMMON_LOCALES,
} from "./core/localizer";

export function init(locale: string) {
  setDefaultLocale(locale);
}

// Core API
export { getAllCountries, getCountryName, getStatesOfCountry };

// Enhanced localization API
export {
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
  getCountriesByRegion,
  getCountriesByLanguage,
  isCountryLocaleSupported,
};

// Localization utilities
export {
  parseLocale,
  normalizeLocale,
  getFallbackLocales,
  createLocalizer,
  getLocalizedName,
  isLocaleSupported,
  COMMON_LOCALES,
};

// Types
export type { LocaleInfo } from "./core/localizer";
