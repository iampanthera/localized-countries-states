export { init } from "./core/config.js";

// Countries + states
export {
  getAllCountries,
  getCountry,
  getCountryName,
  getAvailableCountryLocales,
  hasLocalizedCountries,
} from "./core/country.js";
export {
  getStatesOfCountry,
  getAllStates,
  getState,
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
} from "./core/state.js";

// Locale-bound instance API
export { createLocalizedData } from "./core/factory.js";
export type { LocalizedData } from "./core/factory.js";

// Localization utilities
export {
  parseLocale,
  normalizeLocale,
  getFallbackLocales,
  createLocalizer,
  getLocalizedName,
  isLocaleSupported,
  COMMON_LOCALES,
} from "./core/localizer.js";

// Types
export type { Country, State } from "./core/types.js";
export type { LocaleInfo } from "./core/localizer.js";
