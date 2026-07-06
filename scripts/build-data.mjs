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

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { iso31661, iso31662 } from "iso-3166";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const I18N_DIR = path.join(__dirname, "vendor", "i18n");
const DATA_DIR = path.join(ROOT, "data");

// 12 real translation langs. `en` is the base (English), rest are localized overlays.
const LANGS = ["en", "ru", "de", "fr", "es", "zh", "hi", "pt", "ja", "ar", "it", "he"];
const LOCALIZED_LANGS = LANGS.filter((l) => l !== "en");

const i18n = Object.fromEntries(
  LANGS.map((l) => [l, JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${l}.json`), "utf-8"))])
);

// ---- official reference from iso-3166 ----
const officialCountries = new Set(iso31661.map((c) => c.alpha2)); // alpha2 codes
const officialCountryName = Object.fromEntries(iso31661.map((c) => [c.alpha2, c.name]));

// per-country: official subdivision code (sub part) -> official name
const officialSubs = {};
for (const s of iso31662) {
  const [cc, sub] = s.code.split("-");
  (officialSubs[cc] ||= new Map()).set(sub, s.name);
}

// ---- name normalization + fuzzy match ----
function normalize(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // keep only latin alnum (CJK/Cyrillic drop out -> handled via en/latin langs)
}
const CYRILLIC = /[А-Яа-яЁё]/;
// Guard against upstream cross-script contamination (e.g. zh entries that are actually
// Cyrillic placeholders like "китайский"). Returns false -> value is dropped -> falls back to English.
function isValidLocalizedName(lang, name) {
  if (!name) return false;
  if (lang !== "ru" && CYRILLIC.test(name)) return false;
  return true;
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0]; dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[m];
}
function ratio(a, b) {
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

// Collect every name we know for a db region, across all 12 langs, by matching the region iso within each lang file.
function regionNamesAllLangs(cc, dbRegionIso) {
  const names = {};
  for (const lang of LANGS) {
    const entry = i18n[lang][cc];
    if (!entry || !entry.regions) continue;
    const r = entry.regions.find((x) => x.iso === dbRegionIso);
    if (r && r.name && isValidLocalizedName(lang, r.name)) names[lang] = r.name;
  }
  return names;
}

// Resolve one db region -> official subdivision code.
function resolveOfficialCode(cc, dbIso, names, officialMap, usedOfficial) {
  // 1. direct code match
  if (officialMap.has(dbIso) && !usedOfficial.has(dbIso)) {
    return { code: dbIso, method: "code" };
  }
  const candidateNames = [...new Set(Object.values(names).concat(dbIso).map(normalize))].filter(Boolean);

  // 2. exact / containment on normalized names (skip already-used official codes)
  for (const [offCode, offName] of officialMap) {
    if (usedOfficial.has(offCode)) continue;
    const on = normalize(offName);
    if (!on) continue;
    for (const cn of candidateNames) {
      if (cn.length < 3) continue;
      if (cn === on || (cn.length >= 4 && on.includes(cn)) || (on.length >= 4 && cn.includes(on))) {
        return { code: offCode, method: "name" };
      }
    }
  }
  // 3. fuzzy fallback
  let best = null;
  for (const [offCode, offName] of officialMap) {
    if (usedOfficial.has(offCode)) continue;
    const on = normalize(offName);
    if (on.length < 4) continue;
    for (const cn of candidateNames) {
      if (cn.length < 4) continue;
      const r = ratio(cn, on);
      if (r >= 0.82 && (!best || r > best.r)) best = { code: offCode, r };
    }
  }
  if (best) return { code: best.code, method: `fuzzy(${best.r.toFixed(2)})` };

  // Not part of official ISO 3166-2 -> drop (caller logs it).
  return { code: null, method: "dropped-non-iso" };
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
};
const bump = (m) => (report.methodCounts[m] = (report.methodCounts[m] || 0) + 1);

fs.rmSync(path.join(DATA_DIR, "states"), { recursive: true, force: true });
fs.rmSync(path.join(DATA_DIR, "states-localized"), { recursive: true, force: true });
fs.mkdirSync(path.join(DATA_DIR, "states"), { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, "states-localized"), { recursive: true });

const enDb = i18n.en;
let statesFiles = 0, regionsTotal = 0, localizedRegions = 0;

// Aggregates for the eager, browser-safe bundle consumed by the `compat` entry point.
const allStates = {};            // cc -> { fullCode -> baseName }
const allStatesLocalized = {};   // cc -> { lang -> { fullCode -> name } }

// Country set = official ISO 3166-1 (alpha2). Subdivision set/codes = official ISO 3166-2.
for (const cc of iso31661.map((c) => c.alpha2).sort()) {
  // ---- country names ----
  countriesOut[cc] = { name: (enDb[cc] && enDb[cc].name) || officialCountryName[cc] };
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
  for (const r of (enDb[cc] ? enDb[cc].regions || [] : [])) {
    const names = regionNamesAllLangs(cc, r.iso);
    const { code, method } = resolveOfficialCode(cc, r.iso, names, officialMap, usedOfficial);
    bump(method.startsWith("fuzzy") ? "fuzzy" : method);
    if (code === null) {
      report.unmappedEsosediRegions.push({ country: cc, esosediCode: r.iso, name: names.en || r.name });
      continue;
    }
    usedOfficial.add(code);
    esosediBySub.set(code, names);
  }

  const base = {}; // full ISO code -> English/base name
  const localized = Object.fromEntries(LOCALIZED_LANGS.map((l) => [l, {}]));

  for (const [sub, isoName] of officialMap) {
    const fullCode = `${cc}-${sub}`;
    const names = esosediBySub.get(sub);
    // Prefer esosedi's English name (proper English) over the ISO canonical name (often local).
    base[fullCode] = (names && names.en) || isoName;
    regionsTotal++;
    if (names) {
      let any = false;
      for (const lang of LOCALIZED_LANGS) {
        if (names[lang]) { localized[lang][fullCode] = names[lang]; any = true; }
      }
      if (any) localizedRegions++;
    }
  }

  fs.writeFileSync(path.join(DATA_DIR, "states", `${cc}.json`), JSON.stringify(base, null, 2) + "\n");
  const localizedClean = Object.fromEntries(Object.entries(localized).filter(([, v]) => Object.keys(v).length));
  fs.writeFileSync(
    path.join(DATA_DIR, "states-localized", `${cc}.json`),
    JSON.stringify(localizedClean, null, 2) + "\n"
  );
  allStates[cc] = base;
  allStatesLocalized[cc] = localizedClean;
  statesFiles++;
}

fs.writeFileSync(path.join(DATA_DIR, "countries.json"), JSON.stringify(countriesOut, null, 2) + "\n");
fs.writeFileSync(
  path.join(DATA_DIR, "countries-localized.json"),
  JSON.stringify(countriesLocalized, null, 2) + "\n"
);
fs.writeFileSync(path.join(DATA_DIR, "reconciliation-report.json"), JSON.stringify(report, null, 2) + "\n");

// ---- eager, browser-safe bundle (no fs at runtime) for the `compat` entry point ----
// A plain ESM module so bundlers (Vite/Next) inline it and Node/jest load it directly.
const bundleJs =
  "// AUTO-GENERATED by scripts/build-data.mjs. Do not edit.\n" +
  `export const COUNTRIES = ${JSON.stringify(countriesOut)};\n` +
  `export const COUNTRIES_LOCALIZED = ${JSON.stringify(countriesLocalized)};\n` +
  `export const STATES = ${JSON.stringify(allStates)};\n` +
  `export const STATES_LOCALIZED = ${JSON.stringify(allStatesLocalized)};\n`;
fs.writeFileSync(path.join(DATA_DIR, "bundle.js"), bundleJs);

const bundleDts =
  "// AUTO-GENERATED by scripts/build-data.mjs. Do not edit.\n" +
  "export declare const COUNTRIES: Record<string, { name: string }>;\n" +
  "export declare const COUNTRIES_LOCALIZED: Record<string, Record<string, string>>;\n" +
  "export declare const STATES: Record<string, Record<string, string>>;\n" +
  "export declare const STATES_LOCALIZED: Record<string, Record<string, Record<string, string>>>;\n";
fs.writeFileSync(path.join(DATA_DIR, "bundle.d.ts"), bundleDts);

console.log("countries:", Object.keys(countriesOut).length);
console.log("state files:", statesFiles, "| official ISO 3166-2 subdivisions:", regionsTotal);
console.log("subdivisions with >=1 localized name:", localizedRegions,
  `(${((localizedRegions / regionsTotal) * 100).toFixed(0)}%, rest fall back to base name)`);
console.log("esosedi name-mapping methods:", report.methodCounts);
console.log("unmapped esosedi regions (localization skipped):", report.unmappedEsosediRegions.length);
