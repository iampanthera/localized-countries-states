// Drop-in, `country-state-city`-compatible API — sync + eager, browser-safe (no fs).
//
// Migration: change the import only.
//   -  import { Country, State } from "country-state-city";
//   +  import { Country, State } from "localized-countries-states/compat";
//
// Differences vs country-state-city:
//   - Only Country + State (no City). Country/State expose isoCode/name/countryCode.
//   - Every method takes an OPTIONAL `locale` (BCP-47) for localized names; call setLocale()
//     to set a default. Omit it for English, matching country-state-city's behavior.
//   - State `isoCode` is the BARE subdivision code ("CA"), identical to country-state-city,
//     even though the underlying dataset stores full ISO 3166-2 codes ("US-CA").

import { normalizeLocale } from "../core/localizer.js";
import {
  COUNTRIES,
  COUNTRIES_LOCALIZED,
  STATES,
  STATES_LOCALIZED,
} from "../../data/bundle.js";

export interface ICountry {
  isoCode: string;
  name: string;
}

export interface IState {
  isoCode: string;
  name: string;
  countryCode: string;
}

let defaultLocale: string | undefined;

/** Set a default locale (BCP-47) used when a method is called without one. */
export function setLocale(locale?: string): void {
  defaultLocale = locale;
}

function localeChain(locale?: string): { full: string; lang: string } | null {
  const loc = locale ?? defaultLocale;
  if (!loc) return null;
  const full = normalizeLocale(loc);
  return { full, lang: full.split("-")[0] };
}

function countryName(cc: string, locale?: string): string {
  const base = COUNTRIES[cc]?.name ?? cc;
  const c = localeChain(locale);
  if (!c) return base;
  return COUNTRIES_LOCALIZED[c.full]?.[cc] ?? COUNTRIES_LOCALIZED[c.lang]?.[cc] ?? base;
}

function bareCode(cc: string, fullCode: string): string {
  const prefix = `${cc}-`;
  return fullCode.startsWith(prefix) ? fullCode.slice(prefix.length) : fullCode;
}

function stateName(cc: string, fullCode: string, locale?: string): string {
  const base = STATES[cc]?.[fullCode] ?? fullCode;
  const c = localeChain(locale);
  if (!c) return base;
  const byLang = STATES_LOCALIZED[cc];
  return byLang?.[c.full]?.[fullCode] ?? byLang?.[c.lang]?.[fullCode] ?? base;
}

function toState(cc: string, fullCode: string, locale?: string): IState {
  return { isoCode: bareCode(cc, fullCode), name: stateName(cc, fullCode, locale), countryCode: cc };
}

export const Country = {
  getAllCountries(locale?: string): ICountry[] {
    return Object.keys(COUNTRIES).map((cc) => ({ isoCode: cc, name: countryName(cc, locale) }));
  },

  getCountryByCode(code: string, locale?: string): ICountry | undefined {
    const cc = code?.toUpperCase();
    if (!cc || !COUNTRIES[cc]) return undefined;
    return { isoCode: cc, name: countryName(cc, locale) };
  },
};

export const State = {
  getStatesOfCountry(countryCode: string, locale?: string): IState[] {
    const cc = countryCode?.toUpperCase();
    const subs = cc ? STATES[cc] : undefined;
    if (!subs) return [];
    return Object.keys(subs).map((fullCode) => toState(cc, fullCode, locale));
  },

  getAllStates(locale?: string): IState[] {
    const out: IState[] = [];
    for (const cc of Object.keys(STATES)) {
      for (const fullCode of Object.keys(STATES[cc])) out.push(toState(cc, fullCode, locale));
    }
    return out;
  },

  getStateByCodeAndCountry(stateCode: string, countryCode: string, locale?: string): IState | undefined {
    const cc = countryCode?.toUpperCase();
    const subs = cc ? STATES[cc] : undefined;
    if (!subs || !stateCode) return undefined;
    const wanted = stateCode.toUpperCase();
    const full = `${cc}-${wanted}`;
    if (full in subs) return toState(cc, full, locale);
    if (wanted in subs) return toState(cc, wanted, locale); // caller passed a full code
    return undefined;
  },
};

export default { Country, State, setLocale };
