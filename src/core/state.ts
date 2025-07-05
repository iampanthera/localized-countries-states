import fs from "fs";
import path from "path";
import { normalizeLocale } from "./localizer";

interface StateData {
  [code: string]: string;
}

interface LocalizedStateData {
  [locale: string]: StateData;
}

export function getStatesOfCountry(
  countryCode: string,
  locale?: string
): { code: string; name: string }[] {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "states",
      `${countryCode}.json`
    );
    const raw = fs.readFileSync(filePath, "utf-8");
    const states: StateData = JSON.parse(raw);

    // If no locale specified, return English names
    if (!locale) {
      return Object.entries(states).map(([code, name]) => ({ code, name }));
    }

    // Try to get localized state names
    const normalizedLocale = normalizeLocale(locale);
    const localizedFilePath = path.join(
      process.cwd(),
      "data",
      "states-localized",
      `${countryCode}.json`
    );

    if (fs.existsSync(localizedFilePath)) {
      const localizedRaw = fs.readFileSync(localizedFilePath, "utf-8");
      const localizedStates: LocalizedStateData = JSON.parse(localizedRaw);

      // Try exact locale match first
      if (localizedStates[normalizedLocale]) {
        return Object.entries(states).map(([code, englishName]) => {
          const localizedName = localizedStates[normalizedLocale][code];
          return {
            code,
            name: localizedName || englishName,
          };
        });
      }

      // Try language-only fallback (e.g., 'es' for 'es-ES')
      const language = normalizedLocale.split("-")[0];
      if (localizedStates[language]) {
        return Object.entries(states).map(([code, englishName]) => {
          const localizedName = localizedStates[language][code];
          return {
            code,
            name: localizedName || englishName,
          };
        });
      }
    }

    // Fallback to English names
    return Object.entries(states).map(([code, name]) => ({ code, name }));
  } catch {
    return [];
  }
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
  try {
    const localizedFilePath = path.join(
      process.cwd(),
      "data",
      "states-localized",
      `${countryCode}.json`
    );
    if (fs.existsSync(localizedFilePath)) {
      const localizedRaw = fs.readFileSync(localizedFilePath, "utf-8");
      const localizedStates: LocalizedStateData = JSON.parse(localizedRaw);
      return Object.keys(localizedStates);
    }
  } catch {
    // Ignore errors
  }
  return [];
}

/**
 * Check if localized state names are available for a country and locale
 */
export function hasLocalizedStates(
  countryCode: string,
  locale?: string
): boolean {
  if (!locale) return false;

  try {
    const normalizedLocale = normalizeLocale(locale);
    const localizedFilePath = path.join(
      process.cwd(),
      "data",
      "states-localized",
      `${countryCode}.json`
    );

    if (fs.existsSync(localizedFilePath)) {
      const localizedRaw = fs.readFileSync(localizedFilePath, "utf-8");
      const localizedStates: LocalizedStateData = JSON.parse(localizedRaw);

      // Check exact match or language fallback
      return !!(
        localizedStates[normalizedLocale] ||
        localizedStates[normalizedLocale.split("-")[0]]
      );
    }
  } catch {
    // Ignore errors
  }

  return false;
}
