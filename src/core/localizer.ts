export interface LocaleInfo {
  language: string;
  region?: string;
  script?: string;
  variant?: string;
}

/**
 * Parse and validate a BCP 47 locale string
 */
export function parseLocale(locale: string): LocaleInfo | null {
  try {
    // Basic BCP 47 format: language[-script][-region][-variant]
    const parts = locale.split("-");
    if (parts.length < 1 || parts.length > 4) return null;

    const language = parts[0].toLowerCase();
    if (language.length !== 2 && language.length !== 3) return null;

    const result: LocaleInfo = { language };

    if (parts.length >= 2) {
      const second = parts[1];
      // Check if it's a script (4 letters) or region (2-3 letters)
      if (second.length === 4) {
        result.script = second;
        if (parts.length >= 3) result.region = parts[2];
        if (parts.length >= 4) result.variant = parts[3];
      } else {
        result.region = second;
        if (parts.length >= 3) result.variant = parts[2];
      }
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Normalize locale string to standard format
 */
export function normalizeLocale(locale: string): string {
  const parsed = parseLocale(locale);
  if (!parsed) return "en-US";

  let result = parsed.language.toLowerCase();
  if (parsed.script) {
    result += `-${
      parsed.script.charAt(0).toUpperCase() +
      parsed.script.slice(1).toLowerCase()
    }`;
  }
  if (parsed.region) {
    result += `-${parsed.region.toUpperCase()}`;
  }
  if (parsed.variant) {
    result += `-${parsed.variant}`;
  }

  return result;
}

/**
 * Get fallback locales for a given locale
 */
export function getFallbackLocales(locale: string): string[] {
  const parsed = parseLocale(locale);
  if (!parsed) return ["en-US"];

  const fallbacks: string[] = [locale];

  if (parsed.region && parsed.language !== "en") {
    fallbacks.push(`${parsed.language}-${parsed.region}`);
  }
  if (parsed.language !== "en") {
    fallbacks.push(parsed.language);
  }
  if (parsed.region) {
    fallbacks.push(`en-${parsed.region}`);
  }
  fallbacks.push("en-US", "en");

  return [...new Set(fallbacks)];
}

/**
 * Create a localized display names instance with fallback support
 */
export function createLocalizer(
  locale: string,
  type: "region" | "language" | "script" = "region"
): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type });
  } catch {
    const fallbacks = getFallbackLocales(locale);
    for (const fallback of fallbacks) {
      try {
        return new Intl.DisplayNames([fallback], { type });
      } catch {
        continue;
      }
    }
    return null;
  }
}

/**
 * Get localized name with fallback support
 */
export function getLocalizedName(
  code: string,
  locale: string,
  type: "region" | "language" | "script" = "region"
): string {
  const localizer = createLocalizer(locale, type);
  if (!localizer) return "";

  try {
    const localized = localizer.of(code);
    return localized || "";
  } catch {
    return "";
  }
}

/**
 * Check if a locale is supported by the current environment
 */
export function isLocaleSupported(locale: string): boolean {
  const parsed = parseLocale(locale);
  if (!parsed) return false;

  try {
    new Intl.DisplayNames([locale], { type: "region" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get list of commonly supported locales
 */
export const COMMON_LOCALES = [
  "en-US",
  "en-GB",
  "en-CA",
  "en-AU",
  "es-ES",
  "es-MX",
  "es-AR",
  "es-CO",
  "fr-FR",
  "fr-CA",
  "fr-BE",
  "fr-CH",
  "de-DE",
  "de-AT",
  "de-CH",
  "de-LU",
  "it-IT",
  "it-CH",
  "pt-BR",
  "pt-PT",
  "ru-RU",
  "ru-UA",
  "zh-CN",
  "zh-TW",
  "zh-HK",
  "ja-JP",
  "ko-KR",
  "ar-SA",
  "ar-EG",
  "ar-AE",
  "hi-IN",
  "bn-IN",
  "ta-IN",
  "tr-TR",
  "pl-PL",
  "nl-NL",
  "sv-SE",
  "da-DK",
  "no-NO",
  "fi-FI",
  "hu-HU",
  "cs-CZ",
  "sk-SK",
  "sl-SI",
  "hr-HR",
  "bg-BG",
  "ro-RO",
  "el-GR",
  "he-IL",
  "th-TH",
  "vi-VN",
  "id-ID",
  "ms-MY",
  "tl-PH",
] as const;
