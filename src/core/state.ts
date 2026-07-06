import { normalizeLocale } from "./localizer.js";
import { STATES, STATES_LOCALIZED } from "../../data/bundle.js";

export function getStatesOfCountry(
  countryCode: string,
  locale?: string
): { code: string; name: string }[] {
  const states = STATES[countryCode];
  if (!states) return [];

  if (!locale) {
    return Object.entries(states).map(([code, name]) => ({ code, name }));
  }

  const normalizedLocale = normalizeLocale(locale);
  const localizedStates = STATES_LOCALIZED[countryCode];

  if (localizedStates) {
    if (localizedStates[normalizedLocale]) {
      return Object.entries(states).map(([code, englishName]) => ({
        code,
        name: localizedStates[normalizedLocale][code] || englishName,
      }));
    }

    const language = normalizedLocale.split("-")[0];
    if (localizedStates[language]) {
      return Object.entries(states).map(([code, englishName]) => ({
        code,
        name: localizedStates[language][code] || englishName,
      }));
    }
  }

  return Object.entries(states).map(([code, name]) => ({ code, name }));
}

/**
 * Get state name with localization support
 */
export function getStateName(
  countryCode: string,
  stateCode: string,
  locale?: string
): string {
  const states = getStatesOfCountry(countryCode, locale);
  const state = states.find((s) => s.code === stateCode);
  return state ? state.name : "";
}

/**
 * Get all available locales for a country's states
 */
export function getAvailableStateLocales(countryCode: string): string[] {
  return Object.keys(STATES_LOCALIZED[countryCode] ?? {});
}

/**
 * Check if localized state names are available for a country and locale
 */
export function hasLocalizedStates(
  countryCode: string,
  locale?: string
): boolean {
  if (!locale) return false;

  const localizedStates = STATES_LOCALIZED[countryCode];
  if (!localizedStates) return false;

  const normalizedLocale = normalizeLocale(locale);
  return !!(
    localizedStates[normalizedLocale] ||
    localizedStates[normalizedLocale.split("-")[0]]
  );
}
