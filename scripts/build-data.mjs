// Build localized country/state datasets.
//
// Sources:
//   - iso-3166 (npm)            -> authoritative, CURRENT ISO 3166-1 / 3166-2 codes
//   - scripts/vendor/i18n/*.json -> localized names (esosedi/3166, MIT). 12 real langs.
//
// Strategy: iso-3166 is the source of truth for the SUBDIVISION SET and CODES: the complete,
// current ISO 3166-2 set, emitted with full codes (e.g. ES-AN). esosedi supplies localized
// NAME strings only, reconciled onto those official codes by:
//   1. direct code match, 2. multilingual normalized-name match, 3. fuzzy (Levenshtein) match.
// Every official subdivision is emitted; subdivisions esosedi doesn't cover (e.g. many
// province-level entries) fall back to their base name in non-English locales. esosedi
// regions that map to no official code are skipped and logged in reconciliation-report.json.
//
// Pure logic lives in scripts/lib/ (unit-tested); this file holds the curated
// configuration tables, data loading, the main loop, and output writing.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { iso31661, iso31662 } from "iso-3166";
import { isValidLocalizedName } from "./lib/validate.mjs";
import { regionNamesAllLangs, resolveOfficialCode } from "./lib/reconcile.mjs";
import { stripAdminSuffixes } from "./lib/suffix.mjs";
import { stripLocalizedAdminTypes } from "./lib/localized-strip.mjs";
import {
  resolveBaseNameCollisions,
  resolveLocalizedCollisions,
  collectDuplicateEffectiveNames,
} from "./lib/collisions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const I18N_DIR = path.join(__dirname, "vendor", "i18n");
const DATA_DIR = path.join(ROOT, "data");

// 12 real translation langs. `en` is the base (English), rest are localized overlays.
const LANGS = ["en", "ru", "de", "fr", "es", "zh", "hi", "pt", "ja", "ar", "it", "he"];
const LOCALIZED_LANGS = LANGS.filter((l) => l !== "en");

const EXCLUDED_SUBDIVISION_CODES = new Set(["ES-PM", "ES-RI", "ES-S"]);

const LOCALIZED_NAME_OVERRIDES = {
  es: { "ES-NC": "Comunidad Foral de Navarra" },
};

// esosedi region code -> official ISO 3166-2 code, for entries whose esosedi code
// points at the wrong (or no) official subdivision and whose names are too far
// apart for the name/fuzzy matcher to bridge.
const ESOSEDI_CODE_REMAP = {
  // esosedi's "Region of Murcia" carries code MU, which direct-matches the PROVINCE
  // ES-MU; the entry (and its translations) belongs to the autonomous community ES-MC.
  // The province then correctly falls back to its bare ISO name "Murcia".
  ES: { MU: "MC" },
  // esosedi's "Prague" carries code PR; the official code is CZ-10 ("Praha, Hlavní
  // město"), unreachable by name matching ("Prague" vs "Praha").
  CZ: { PR: "10" },
};

const BASE_NAME_OVERRIDES = {
  "TW-CYI": "Chiayi City", // ISO category: city
  "TW-CYQ": "Chiayi County", // ISO category: county
  "TW-HSZ": "Hsinchu City",
  "TW-HSQ": "Hsinchu County",
  "BD-H": "Mymensingh Division", // division (matches esosedi's "Dhaka Division" style)
  "BD-34": "Mymensingh District", // district within BD-H
  "LU-L": "Luxembourg District", // legacy district; the canton LU-LU keeps "Luxembourg"
  "LU-D": "Diekirch District", // legacy district; the canton LU-DI keeps "Diekirch"
  "LU-G": "Grevenmacher District", // legacy district; the canton LU-GR keeps "Grevenmacher"
  // ISO comma-inverted display forms, uncovered by esosedi ("London, City of").
  "GB-LND": "City of London",
  "GB-BST": "City of Bristol",
  "GB-EDH": "City of Edinburgh",
  "GB-VGL": "Vale of Glamorgan", // ISO: "Vale of Glamorgan, The"
  "IT-BZ": "Bolzano", // ISO: "Bolzano, Bozen" (bilingual it/de form)
  "ID-ML": "Maluku Islands", // geographical unit; the province ID-MA keeps "Maluku"
  "DK-015": "Copenhagen County", // legacy county (Københavns Amt)
  "DK-101": "Copenhagen Municipality", // municipality (Københavns Kommune)
  // Estonian urban (linn) vs rural (vald) municipality pairs: the city keeps the plain
  // name, the rural municipality gets the Estonian "vald" qualifier. NOTE: which code
  // is the vald differs per pair — verified against ISO categories.
  "EE-661": "Rakvere vald", // rural; EE-663 is Rakvere linn
  "EE-796": "Tartu vald", // rural; EE-793 is Tartu linn
  "EE-899": "Viljandi vald", // rural; EE-897 is Viljandi linn
  "EE-917": "Võru vald", // rural; EE-919 is Võru linn
  // esosedi collapses these onto their neighbour's name; curated instead of the
  // automatic ISO-name fallback to match each country's sibling naming style.
  "CZ-72": "Zlín Region", // kraj (matches "South Bohemian Region" style); CZ-724 keeps "Zlín"
  "YE-SN": "Sana'a Governorate", // matches "'Adan Governorate" style
  "YE-SA": "Amanat Al Asimah", // capital municipality (Amānat al ‘Āşimah)
};

const i18n = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${l}.json`), "utf-8"))]),
);

// ---- official reference from iso-3166 ----
const officialCountryName = Object.fromEntries(iso31661.map((c) => [c.alpha2, c.name]));

// per-country: official subdivision code (sub part) -> official name
const officialSubs = {};
for (const s of iso31662) {
  const [cc, sub] = s.code.split("-");
  (officialSubs[cc] ||= new Map()).set(sub, s.name);
}

// ---- build ----
const countriesOut = {};
const countriesLocalized = Object.fromEntries(LOCALIZED_LANGS.map((l) => [l, {}]));
const report = {
  generatedFrom: "iso-3166 (region set + codes) + esosedi/3166 (localized names, MIT)",
  langs: LANGS,
  codeFormat: "ISO 3166-2 full code (e.g. ES-AN)",
  granularity: "complete ISO 3166-2 (all subdivision levels)",
  methodCounts: {},
  unmappedEsosediRegions: [], // esosedi regions that don't map to any official ISO 3166-2 code
  baseNameCollisionsResolved: [], // base names reverted to ISO canonical to break collisions
  suffixesStripped: { total: 0, byCountry: {} }, // renames visible in the data diff
  suffixStripSkipped: [], // {country, code, name, reason: override|exempt|generic-remainder|qualifier-remainder|collision}
  localizedSuffixesStripped: { total: 0, byLang: {} }, // localized admin-type words removed ("Prefectura de X" -> "X")
  localizedStrippedToBase: 0, // localized entries whose stripped form equals the English base (dropped, fall back)
  localizedStripSkipped: [], // {country, lang, code, name, reason: override|too-short|lowercase-remainder|generic-remainder|collision}
  englishCopiesDropped: 0, // localized entries identical to the English name (untranslated upstream copies)
  localizedEntriesDropped: [], // localized entries dropped (collided within their language)
};
const bump = (m) => (report.methodCounts[m] = (report.methodCounts[m] || 0) + 1);

const enDb = i18n.en;
let statesCountries = 0,
  regionsTotal = 0,
  localizedRegions = 0;
const duplicateViolations = [];

// Aggregates for the eager, browser-safe bundle (the package's only runtime data).
const allStates = {}; // cc -> { fullCode -> baseName }
const allStatesLocalized = {}; // cc -> { lang -> { fullCode -> name } }

// Country set = official ISO 3166-1 (alpha2). Subdivision set/codes = official ISO 3166-2.
for (const cc of iso31661.map((c) => c.alpha2).sort()) {
  // ---- country names ----
  countriesOut[cc] = {
    name: (enDb[cc] && enDb[cc].name) || officialCountryName[cc],
  };
  for (const lang of LOCALIZED_LANGS) {
    const n = i18n[lang][cc] && i18n[lang][cc].name;
    if (n && isValidLocalizedName(lang, n)) countriesLocalized[lang][cc] = n;
  }

  // ---- subdivisions: full official ISO 3166-2 set from iso-3166 ----
  const officialMap = officialSubs[cc]; // Map(sub -> iso name)
  if (!officialMap || !officialMap.size) continue;

  // Map esosedi's localized names onto official codes (sub -> {names}).
  const esosediBySub = new Map();
  const usedOfficial = new Set();
  for (const r of enDb[cc] ? enDb[cc].regions || [] : []) {
    const names = regionNamesAllLangs(i18n, LANGS, cc, r.iso);
    const remapped = ESOSEDI_CODE_REMAP[cc]?.[r.iso];
    const { code, method } = remapped
      ? { code: remapped, method: "remap" }
      : resolveOfficialCode(r.iso, names, officialMap, usedOfficial);
    bump(method.startsWith("fuzzy") ? "fuzzy" : method);
    if (code === null) {
      report.unmappedEsosediRegions.push({
        country: cc,
        esosediCode: r.iso,
        name: names.en || r.name,
      });
      continue;
    }
    usedOfficial.add(code);
    esosediBySub.set(code, names);
  }

  const base = {}; // full ISO code -> English/base name
  const localized = Object.fromEntries(LOCALIZED_LANGS.map((l) => [l, {}]));

  for (const [sub, isoName] of officialMap) {
    const fullCode = `${cc}-${sub}`;
    if (EXCLUDED_SUBDIVISION_CODES.has(fullCode)) continue;
    const names = esosediBySub.get(sub);
    // Prefer esosedi's English name (proper English) over the ISO canonical name (often local).
    base[fullCode] = BASE_NAME_OVERRIDES[fullCode] ?? ((names && names.en) || isoName);
    regionsTotal++;
    if (names) {
      let any = false;
      for (const lang of LOCALIZED_LANGS) {
        // A "localization" identical to the English name is upstream contamination
        // (whole layers are untranslated English copies: hi/pt/ja/he, partially ar).
        // Dropping it lets the code fall back to the (suffix-stripped) base name.
        if (!names[lang]) continue;
        if (names[lang] === names.en) {
          report.englishCopiesDropped++;
          continue;
        }
        localized[lang][fullCode] = names[lang];
        any = true;
      }
      if (any) localizedRegions++;
    }
    // Apply curated localized-name overrides (runs even when esosedi has no entry).
    for (const lang of LOCALIZED_LANGS) {
      const override = LOCALIZED_NAME_OVERRIDES[lang]?.[fullCode];
      if (override) localized[lang][fullCode] = override;
    }
  }

  resolveBaseNameCollisions(cc, base, officialMap, report);
  stripAdminSuffixes(cc, base, BASE_NAME_OVERRIDES, report);
  stripLocalizedAdminTypes(cc, base, localized, LOCALIZED_NAME_OVERRIDES, report);
  resolveLocalizedCollisions(cc, base, localized, LOCALIZED_LANGS, report);
  duplicateViolations.push(...collectDuplicateEffectiveNames(cc, base, localized, LANGS));

  const localizedClean = Object.fromEntries(
    Object.entries(localized).filter(([, v]) => Object.keys(v).length),
  );
  allStates[cc] = base;
  allStatesLocalized[cc] = localizedClean;
  statesCountries++;
}

if (duplicateViolations.length) {
  console.error(
    "DUPLICATE EFFECTIVE SUBDIVISION NAMES — add the codes to BASE_NAME_OVERRIDES or fix the upstream mapping:",
  );
  for (const v of duplicateViolations) {
    console.error(`  ${v.country} [${v.lang}] "${v.name}": ${v.codes.join(", ")}`);
  }
  process.exit(1);
}

fs.writeFileSync(
  path.join(__dirname, "reconciliation-report.json"),
  JSON.stringify(report, null, 2) + "\n",
);

// ---- eager, browser-safe bundle (no fs at runtime) ----
// Plain ESM + CJS modules so bundlers (Vite/Next) inline them and Node/jest load them directly.
const payloads = [
  ["COUNTRIES", countriesOut],
  ["COUNTRIES_LOCALIZED", countriesLocalized],
  ["STATES", allStates],
  ["STATES_LOCALIZED", allStatesLocalized],
];
const header = "// AUTO-GENERATED by scripts/build-data.mjs. Do not edit.\n";

const bundleJs =
  header +
  payloads.map(([name, data]) => `export const ${name} = ${JSON.stringify(data)};\n`).join("");
fs.writeFileSync(path.join(DATA_DIR, "bundle.js"), bundleJs);

const bundleCjs =
  header +
  payloads.map(([name, data]) => `const ${name} = ${JSON.stringify(data)};\n`).join("") +
  `module.exports = { ${payloads.map(([name]) => name).join(", ")} };\n`;
fs.writeFileSync(path.join(DATA_DIR, "bundle.cjs"), bundleCjs);

const bundleDts =
  header +
  "export declare const COUNTRIES: Record<string, { name: string }>;\n" +
  "export declare const COUNTRIES_LOCALIZED: Record<string, Record<string, string>>;\n" +
  "export declare const STATES: Record<string, Record<string, string>>;\n" +
  "export declare const STATES_LOCALIZED: Record<string, Record<string, Record<string, string>>>;\n";
fs.writeFileSync(path.join(DATA_DIR, "bundle.d.ts"), bundleDts);

console.log("countries:", Object.keys(countriesOut).length);
console.log(
  "countries with subdivisions:",
  statesCountries,
  "| official ISO 3166-2 subdivisions:",
  regionsTotal,
);
console.log(
  "subdivisions with >=1 localized name:",
  localizedRegions,
  `(${((localizedRegions / regionsTotal) * 100).toFixed(0)}%, rest fall back to base name)`,
);
console.log("esosedi name-mapping methods:", report.methodCounts);
console.log(
  "unmapped esosedi regions (localization skipped):",
  report.unmappedEsosediRegions.length,
);
console.log(
  "duplicate-name fixes: base names reverted to ISO:",
  report.baseNameCollisionsResolved.length,
  "| localized entries dropped:",
  report.localizedEntriesDropped.length,
);
console.log(
  "admin-type suffixes stripped:",
  report.suffixesStripped.total,
  "| kept (override/exempt/generic/qualifier/collision):",
  report.suffixStripSkipped.length,
);
console.log(
  "untranslated English copies dropped from localized layers:",
  report.englishCopiesDropped,
);
console.log(
  "localized admin-type words stripped:",
  report.localizedSuffixesStripped.total,
  "| became identical to base (dropped):",
  report.localizedStrippedToBase,
  "| kept:",
  report.localizedStripSkipped.length,
  "| by lang:",
  report.localizedSuffixesStripped.byLang,
);
