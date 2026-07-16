import type { State } from "./types.js";
import { resolveLocale, resolveStateName, toFullStateCode, collatorFor } from "./resolve.js";
import { STATES, STATES_LOCALIZED } from "#data";

/** All ISO 3166-2 subdivisions of a country, sorted by localized name. */
export function getStatesOfCountry(countryCode: string, locale?: string): State[] {
  const cc = countryCode?.toUpperCase();
  const states = cc ? STATES[cc] : undefined;
  if (!states) return [];
  const loc = resolveLocale(locale);
  const collator = collatorFor(loc);
  return Object.keys(states)
    .map((code) => ({ code, countryCode: cc, name: resolveStateName(cc, code, loc) as string }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

/** Every subdivision of every country, sorted by localized name. */
export function getAllStates(locale?: string): State[] {
  const loc = resolveLocale(locale);
  const collator = collatorFor(loc);
  const out: State[] = [];
  for (const cc of Object.keys(STATES)) {
    for (const code of Object.keys(STATES[cc])) {
      out.push({ code, countryCode: cc, name: resolveStateName(cc, code, loc) as string });
    }
  }
  return out.sort((a, b) => collator.compare(a.name, b.name));
}

/** Look up one subdivision; `stateCode` may be bare ("CA") or full ("US-CA"). */
export function getState(
  countryCode: string,
  stateCode: string,
  locale?: string,
): State | undefined {
  const cc = countryCode?.toUpperCase();
  if (!cc || !stateCode) return undefined;
  const code = toFullStateCode(cc, stateCode);
  const name = resolveStateName(cc, code, resolveLocale(locale));
  return name === undefined ? undefined : { code, countryCode: cc, name };
}

export function getStateName(
  countryCode: string,
  stateCode: string,
  locale?: string,
): string | undefined {
  return getState(countryCode, stateCode, locale)?.name;
}

/** Languages a country's bundled subdivision data is localized in. */
export function getAvailableStateLocales(countryCode: string): string[] {
  return Object.keys(STATES_LOCALIZED[countryCode?.toUpperCase()] ?? {});
}

/** Whether bundled localized subdivision names exist for the country and locale. */
export function hasLocalizedStates(countryCode: string, locale?: string): boolean {
  const loc = resolveLocale(locale);
  if (!loc) return false;
  const layers = STATES_LOCALIZED[countryCode?.toUpperCase()];
  if (!layers) return false;
  return !!(layers[loc.normalized] || layers[loc.language]);
}
