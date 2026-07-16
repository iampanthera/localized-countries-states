// Administrative-type stripping for LOCALIZED name layers — the counterpart of
// suffix.mjs (which handles the English base names). Romance/Germanic languages and
// Arabic put the type word FIRST ("Prefectura de Aomori", "Provinz Limburg",
// "ولاية طوكيو"), so these are prefix patterns. Deliberately NOT covered:
//   ru — adjectival suffix forms ("Московская область"): the remainder is a bare
//        adjective that cannot stand alone (same reasoning as the English
//        Voivodeship exclusion);
//   zh/ja — single-character type suffixes (省/縣/県) are integral to how sibling
//        subdivisions are told apart (市 vs 縣 pairs);
//   he/hi — no dominant type-word pattern in the upstream data.

import { normalize } from "./text.mjs";
import { GENERIC_REMAINDER_TOKENS } from "./suffix.mjs";

// Romance patterns require the connective ("de"/"di"/"du"...) so proper names that
// merely START with a type word ("Región Metropolitana de Santiago") never match.
// German/Arabic attach the type word directly.
export const LOCALIZED_STRIP_PATTERNS = {
  es: /^(?:Provincia|Región|Distrito|Municipalidad|Municipio|Gobernación|Departamento|Óblast|Oblast|Prefectura|Condado|Parroquia|Cantón|Estado) (?:de las |de los |de la |del |de )/,
  pt: /^(?:Província|Região|Distrito|Municipalidade|Município|Departamento|Oblast|Prefeitura|Condado|Paróquia|Cantão|Estado) (?:das |dos |da |do |de )/,
  fr: /^(?:Province|Région|Gouvernorat|Département|Comté|Préfecture|District|État|Oblast|Canton|Municipalité|Paroisse|Wilaya) (?:de la |de l['’]|des |du |de |d['’])/,
  it: /^(?:Provincia|Regione|Distretto|Dipartimento|Governatorato|Prefettura|Contea|Parrocchia|Cantone|Oblast'?|Municipalità) (?:delle |degli |della |dell['’]|del |di |d['’])/,
  de: /^(?:Provinz|Präfektur|Departamento|Département|Departement|Oblast|Gouvernement|Region|Landkreis|Kreis|Bezirk|Kanton|Distrikt) /,
  ar: /^(?:ولاية|مقاطعة|محافظة|منطقة) /,
};

// Arabic also carries transliterated "X أوبلاست" (oblast) as a trailing word.
const AR_OBLAST_SUFFIX = / أوبلاست$/;

// Localized directional/generic words (normalized): a remainder made only of these
// cannot stand alone ("Province du Nord", "Región Central"). The English set from
// suffix.mjs is included since layers occasionally mix English tokens.
const LATIN_GENERIC_TOKENS = new Set(
  [
    ...GENERIC_REMAINDER_TOKENS,
    "norte",
    "sur",
    "este",
    "oeste",
    "occidental",
    "oriental",
    "septentrional",
    "meridional",
    "ovest",
    "settentrionale",
    "meridionale",
    "occidentale",
    "orientale",
    "centrale",
    "centro",
    "norden",
    "suden",
    "osten",
    "westen",
    "zentral",
    "capitale",
    "litoral",
    "littorale",
    "maritima",
    "interieure",
    "superieure",
    "inferieure",
    "haute",
    "basse",
    "haut",
    "bas",
    "alto",
    "alta",
    "bajo",
    "baja",
    "baixo",
    "baixa",
  ].map((t) => normalize(t)),
);

// Decide the strip for one localized name: {stripped} | {skip: reason} | null.
export function localizedStripDecision(lang, name) {
  const re = LOCALIZED_STRIP_PATTERNS[lang];
  let stripped = null;
  const m = re ? re.exec(name) : null;
  if (m) stripped = name.slice(m[0].length).trim();
  else if (lang === "ar" && AR_OBLAST_SUFFIX.test(name))
    stripped = name.replace(AR_OBLAST_SUFFIX, "").trim();
  if (stripped === null) return null;
  if (stripped.length < 2) return { skip: "too-short" };
  // Latin scripts: the remainder must look like a proper name, not a leftover article.
  if (lang !== "ar" && !/^[\p{Lu}\p{N}]/u.test(stripped)) return { skip: "lowercase-remainder" };
  const tokens = stripped
    .split(/[\s-]+/)
    .map((t) => normalize(t))
    .filter(Boolean);
  if (tokens.length && tokens.every((t) => LATIN_GENERIC_TOKENS.has(t)))
    return { skip: "generic-remainder" };
  return { stripped };
}

// Uniqueness key: diacritic-normalized latin, or the raw string for non-latin
// scripts (normalize() maps those to "", which would make all names collide).
const key = (name) => normalize(name) || name;

// Collision-aware apply, per (country, language) layer. Same two-phase shape as
// stripAdminSuffixes: collect candidates, count the post-strip pool of EFFECTIVE
// names (layer value, falling back to base), apply only where the stripped name is
// unique. A stripped name identical to the English base is dropped from the layer
// entirely — the fallback then shows the same string without storing a copy.
// `overrides` is LOCALIZED_NAME_OVERRIDES: curated verbatim names never strip.
export function stripLocalizedAdminTypes(cc, base, localized, overrides, report) {
  for (const [lang, layer] of Object.entries(localized)) {
    const candidates = new Map(); // code -> stripped name
    for (const [code, name] of Object.entries(layer)) {
      if (overrides[lang]?.[code]) {
        report.localizedStripSkipped.push({ country: cc, lang, code, name, reason: "override" });
        continue;
      }
      const d = localizedStripDecision(lang, name);
      if (!d) continue;
      if (d.skip) {
        report.localizedStripSkipped.push({ country: cc, lang, code, name, reason: d.skip });
        continue;
      }
      candidates.set(code, d.stripped);
    }
    if (candidates.size === 0) continue;
    const counts = new Map();
    for (const code of Object.keys(base)) {
      const k = key(candidates.get(code) ?? layer[code] ?? base[code]);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    for (const [code, stripped] of candidates) {
      if (counts.get(key(stripped)) !== 1) {
        report.localizedStripSkipped.push({
          country: cc,
          lang,
          code,
          name: layer[code],
          reason: "collision",
        });
        continue;
      }
      if (stripped === base[code]) {
        delete layer[code];
        report.localizedStrippedToBase++;
      } else {
        layer[code] = stripped;
        report.localizedSuffixesStripped.total++;
        report.localizedSuffixesStripped.byLang[lang] =
          (report.localizedSuffixesStripped.byLang[lang] || 0) + 1;
      }
    }
  }
}
