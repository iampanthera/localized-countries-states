import { setDefaultLocale } from "./config.js";
import {
  getAllCountries,
  getCountryName,
  isCountryLocaleSupported,
  getAvailableCountryLocales,
  hasLocalizedCountries,
} from "./core/country.js";
import {
  getStatesOfCountry,
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
} from "./core/state.js";
import {
  parseLocale,
  normalizeLocale,
  getFallbackLocales,
  createLocalizer,
  getLocalizedName,
  isLocaleSupported,
  COMMON_LOCALES,
} from "./core/localizer.js";

export function init(locale: string) {
  setDefaultLocale(locale);
}

// Core API
export { getAllCountries, getCountryName, getStatesOfCountry };

// Availability helpers
export {
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
  isCountryLocaleSupported,
  getAvailableCountryLocales,
  hasLocalizedCountries,
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

// country-state-city-compatible API (also available via the "/compat" entry point)
export { Country, State, setLocale } from "./compat/index.js";
export type { ICountry, IState } from "./compat/index.js";

// Types
export type { LocaleInfo } from "./core/localizer.js";
