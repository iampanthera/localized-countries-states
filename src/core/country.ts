import type { Country } from "./types.js";
import { resolveLocale, resolveCountryName, collatorFor } from "./resolve.js";
import { COUNTRIES, COUNTRIES_LOCALIZED } from "#data";

/** All ISO 3166-1 countries, sorted by localized name. */
export function getAllCountries(locale?: string): Country[] {
  const loc = resolveLocale(locale);
  const collator = collatorFor(loc);
  return Object.keys(COUNTRIES)
    .map((code) => ({ code, name: resolveCountryName(code, loc) as string }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

export function getCountry(code: string, locale?: string): Country | undefined {
  const cc = code?.toUpperCase();
  if (!cc) return undefined;
  const name = resolveCountryName(cc, resolveLocale(locale));
  return name === undefined ? undefined : { code: cc, name };
}

export function getCountryName(code: string, locale?: string): string | undefined {
  return getCountry(code, locale)?.name;
}

/** Languages the bundled country data is localized in (e.g. ["ru", "de", ...]). */
export function getAvailableCountryLocales(): string[] {
  return Object.keys(COUNTRIES_LOCALIZED);
}

/** Whether bundled localized country names exist for the given locale. */
export function hasLocalizedCountries(locale?: string): boolean {
  const loc = resolveLocale(locale);
  if (!loc) return false;
  return !!(COUNTRIES_LOCALIZED[loc.normalized] || COUNTRIES_LOCALIZED[loc.language]);
}
