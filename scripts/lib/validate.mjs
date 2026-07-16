// Guards against upstream contamination in localized name layers.

export const CYRILLIC = /[А-Яа-яЁё]/;

// Upstream sometimes leaks a language's own name where a region name belongs
// (e.g. UA's zh layer containing the literal string "Chinese").
export const LANGUAGE_NAME_LEAKS = new Set([
  "english",
  "russian",
  "german",
  "french",
  "spanish",
  "chinese",
  "hindi",
  "portuguese",
  "japanese",
  "arabic",
  "italian",
  "hebrew",
]);

// Guard against upstream cross-script contamination (e.g. zh entries that are actually
// Cyrillic placeholders like "китайский"). Returns false -> value is dropped -> falls back to English.
export function isValidLocalizedName(lang, name) {
  if (!name) return false;
  if (lang !== "ru" && CYRILLIC.test(name)) return false;
  if (LANGUAGE_NAME_LEAKS.has(String(name).trim().toLowerCase())) return false;
  return true;
}
