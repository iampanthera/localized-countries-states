// Locale-bound instance API — the replacement for v1's global `init()` state.
// Apps with one app-wide locale create an instance once and drop the per-call param.

import type { Country, State } from "./types.js";
import { resolveLocale } from "./resolve.js";
import { getAllCountries, getCountry, getCountryName, hasLocalizedCountries } from "./country.js";
import {
  getStatesOfCountry,
  getAllStates,
  getState,
  getStateName,
  hasLocalizedStates,
} from "./state.js";

export interface LocalizedData {
  /** The normalized BCP-47 locale this instance is bound to; undefined = English. */
  readonly locale: string | undefined;
  getAllCountries(): Country[];
  getCountry(code: string): Country | undefined;
  getCountryName(code: string): string | undefined;
  getStatesOfCountry(countryCode: string): State[];
  getAllStates(): State[];
  getState(countryCode: string, stateCode: string): State | undefined;
  getStateName(countryCode: string, stateCode: string): string | undefined;
  hasLocalizedCountries(): boolean;
  hasLocalizedStates(countryCode: string): boolean;
}

export function createLocalizedData(locale?: string): LocalizedData {
  const l = resolveLocale(locale)?.normalized;
  return {
    locale: l,
    getAllCountries: () => getAllCountries(l),
    getCountry: (code) => getCountry(code, l),
    getCountryName: (code) => getCountryName(code, l),
    getStatesOfCountry: (countryCode) => getStatesOfCountry(countryCode, l),
    getAllStates: () => getAllStates(l),
    getState: (countryCode, stateCode) => getState(countryCode, stateCode, l),
    getStateName: (countryCode, stateCode) => getStateName(countryCode, stateCode, l),
    hasLocalizedCountries: () => hasLocalizedCountries(l),
    hasLocalizedStates: (countryCode) => hasLocalizedStates(countryCode, l),
  };
}
