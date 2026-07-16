// The single locale-resolution core. Every public API goes through these helpers,
// so the fallback order lives in exactly one place:
//   countries: bundled localized layer -> Intl.DisplayNames -> base English name
//   states:    bundled localized layer -> base English name
// The bundled layers are keyed by language ("fr"); the normalized locale is probed
// first so region-specific layers ("fr-CA") keep working if the data ever grows them.

import { getLocalizedName, normalizeLocale } from "./localizer.js";
import { getDefaultLocale } from "./config.js";
import { COUNTRIES, COUNTRIES_LOCALIZED, STATES, STATES_LOCALIZED } from "#data";

export interface ResolvedLocale {
  /** Normalized BCP-47 locale, e.g. "fr-FR". */
  normalized: string;
  /** Language subtag, e.g. "fr". */
  language: string;
}

export function resolveLocale(locale?: string): ResolvedLocale | undefined {
  const effective = locale ?? getDefaultLocale();
  if (!effective) return undefined;
  const normalized = normalizeLocale(effective);
  return { normalized, language: normalized.split("-")[0] };
}

/** Collator for sorting result lists; English when no locale is given (deterministic). */
export function collatorFor(loc?: ResolvedLocale): Intl.Collator {
  return new Intl.Collator(loc?.normalized ?? "en");
}

function probeLayers(
  layers: Record<string, Record<string, string>> | undefined,
  code: string,
  loc: ResolvedLocale,
): string | undefined {
  if (!layers) return undefined;
  for (const key of [loc.normalized, loc.language]) {
    const name = layers[key]?.[code];
    if (name) return name;
  }
  return undefined;
}

const EN_COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  CZ: "Czech Republic", // CLDR: "Czechia"
  TR: "Turkey", // CLDR: "Türkiye"
  PS: "Palestine", // CLDR: "Palestinian Territories"
};

export function resolveCountryName(code: string, loc?: ResolvedLocale): string | undefined {
  const country = COUNTRIES[code] as { name: string } | undefined;
  if (!country) return undefined;
  if (!loc) return country.name;
  if (loc.language === "en" && EN_COUNTRY_NAME_OVERRIDES[code]) {
    return EN_COUNTRY_NAME_OVERRIDES[code];
  }
  return (
    probeLayers(COUNTRIES_LOCALIZED, code, loc) ||
    getLocalizedName(code, loc.normalized, "region") ||
    country.name
  );
}

/** `fullCode` must be a full ISO 3166-2 code ("US-CA"); use toFullStateCode upstream. */
export function resolveStateName(
  countryCode: string,
  fullCode: string,
  loc?: ResolvedLocale,
): string | undefined {
  const base = STATES[countryCode]?.[fullCode];
  if (base === undefined) return undefined;
  if (!loc) return base;
  return probeLayers(STATES_LOCALIZED[countryCode], fullCode, loc) ?? base;
}

/** Accepts a bare ("CA") or full ("US-CA") subdivision code and returns the full form. */
export function toFullStateCode(countryCode: string, stateCode: string): string {
  const code = stateCode.toUpperCase();
  return code.startsWith(`${countryCode}-`) ? code : `${countryCode}-${code}`;
}
