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
const LANGS = [
  "en",
  "ru",
  "de",
  "fr",
  "es",
  "zh",
  "hi",
  "pt",
  "ja",
  "ar",
  "it",
  "he",
];
const LOCALIZED_LANGS = LANGS.filter((l) => l !== "en");

const EXCLUDED_SUBDIVISION_CODES = new Set(["ES-PM", "ES-RI", "ES-S"]);

const LOCALIZED_NAME_OVERRIDES = {
  es: { "ES-NC": "Comunidad Foral de Navarra" },
};

const BASE_NAME_OVERRIDES = {
  "TW-CYI": "Chiayi City", // ISO category: city
  "TW-CYQ": "Chiayi County", // ISO category: county
  "TW-HSZ": "Hsinchu City",
  "TW-HSQ": "Hsinchu County",
  "BD-H": "Mymensingh Division", // division (matches esosedi's "Dhaka Division" style)
  "BD-34": "Mymensingh District", // district within BD-H
  "LU-L": "Luxembourg District", // legacy district; the canton LU-LU keeps "Luxembourg"
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

// ---- administrative-type suffix stripping ----
// Trailing English administrative-type words are removed from base names ("Aomori
// Prefecture" -> "Aomori") to match ISO style and keep dropdowns clean. Deliberately
// NOT included: City, Territory (part of the proper name: "Mexico City", "Northern
// Territory"); Krai/Okrug/Republic (transliterated or conventional English: "Altai
// Krai", "Komi Republic"); Voivodeship (PL remainders are bare adjectives: "Masovian").
const STRIPPABLE_SUFFIXES = [
  "Prefecture",
  "Province",
  "Region",
  "District",
  "County",
  "Department",
  "Governorate",
  "Municipality",
  "Oblast",
  "Parish",
  "Division",
  "State",
];
const SUFFIX_RE = new RegExp(`^(.*\\S) (?:${STRIPPABLE_SUFFIXES.join("|")})$`);

// Keep the suffix when the remainder is purely directional/generic — "Northern
// Province" (LK), "Capital Region" (IS), "Far North Region" (CM), "Free State" (ZA),
// "Centre-Est Region" (BF). Includes French directionals used in BF/CM/TD names.
const GENERIC_REMAINDER_TOKENS = new Set([
  "north",
  "south",
  "east",
  "west",
  "northern",
  "southern",
  "eastern",
  "western",
  "northeast",
  "northwest",
  "southeast",
  "southwest",
  "northeastern",
  "northwestern",
  "southeastern",
  "southwestern",
  "central",
  "middle",
  "upper",
  "lower",
  "inner",
  "outer",
  "far",
  "capital",
  "coastal",
  "maritime",
  "littoral",
  "interior",
  "federal",
  "free",
  "nord",
  "sud",
  "est",
  "ouest",
  "centre",
  "center",
]);

// Keep the suffix when the remainder ENDS in a compound designation — the trailing
// word belongs to a multi-word type: "Gorno-Badakhshan Autonomous Province",
// "Jewish Autonomous Oblast", "Santiago Metropolitan Region".
const COMPOUND_QUALIFIER_TOKENS = new Set([
  "autonomous",
  "special",
  "metropolitan",
  "national",
  "union",
  "federal",
  "capital",
]);

// Curated exact-name exemptions: adjectival remainders that can't stand alone
// ("South Bohemian"), plus names kept so their country's region list stays uniform.
const SUFFIX_STRIP_EXEMPT = new Set([
  "Central Bohemian Region", // CZ
  "South Bohemian Region",
  "South Moravian Region",
  "Moravian-Silesian Region",
  "Plzeň Region",
  "Vysočina Region",
  "Flemish Region", // BE
  "North Denmark Region", // DK
  "Central Denmark Region",
]);

const i18n = Object.fromEntries(
  LANGS.map((l) => [
    l,
    JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${l}.json`), "utf-8")),
  ]),
);

// ---- official reference from iso-3166 ----
const officialCountries = new Set(iso31661.map((c) => c.alpha2)); // alpha2 codes
const officialCountryName = Object.fromEntries(
  iso31661.map((c) => [c.alpha2, c.name]),
);

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
// Upstream sometimes leaks a language's own name where a region name belongs
// (e.g. UA's zh layer containing the literal string "Chinese").
const LANGUAGE_NAME_LEAKS = new Set([
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
function isValidLocalizedName(lang, name) {
  if (!name) return false;
  if (lang !== "ru" && CYRILLIC.test(name)) return false;
  if (LANGUAGE_NAME_LEAKS.has(String(name).trim().toLowerCase())) return false;
  return true;
}
function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
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
  const candidateNames = [
    ...new Set(Object.values(names).concat(dbIso).map(normalize)),
  ].filter(Boolean);

  // 2. exact / containment on normalized names (skip already-used official codes)
  for (const [offCode, offName] of officialMap) {
    if (usedOfficial.has(offCode)) continue;
    const on = normalize(offName);
    if (!on) continue;
    for (const cn of candidateNames) {
      if (cn.length < 3) continue;
      if (
        cn === on ||
        (cn.length >= 4 && on.includes(cn)) ||
        (on.length >= 4 && cn.includes(on))
      ) {
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

// ---- duplicate-name resolution ----
// Effective display names must be unique per (country, language) — two identical
// entries in an address dropdown are indistinguishable. Base collisions caused by
// esosedi collapsing two distinct ISO names are reverted to the ISO canonical name;
// localized-layer collisions are dropped so the affected codes fall back to their
// (unique) English base. Pairs where ISO itself repeats a name are handled up front
// by BASE_NAME_OVERRIDES; anything unresolvable fails the build (see invariant below).

// Un-invert the ISO comma form for display: "Asturias, Principado de" -> "Principado de Asturias".
function displayIsoName(name) {
  const m = /^(.+), (.+)$/.exec(name);
  return m ? `${m[2]} ${m[1]}` : name;
}

function groupCodesByName(codes, nameOf) {
  const byName = new Map();
  for (const code of codes) {
    const name = nameOf(code);
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(code);
  }
  return byName;
}

// Revert wrongly-collapsed base names to the ISO canonical name. If exactly one code's
// ISO name matches the collided name (same rule as resolveOfficialCode step 2), it
// rightfully keeps the esosedi English name; all others revert. Otherwise all revert —
// safe whenever the ISO names within the group differ.
function resolveBaseNameCollisions(cc, base, officialMap) {
  for (const [name, codes] of groupCodesByName(
    Object.keys(base),
    (c) => base[c],
  )) {
    if (codes.length < 2) continue;
    const nn = normalize(name);
    const keepers = codes.filter((code) => {
      const on = normalize(officialMap.get(code.slice(cc.length + 1)));
      if (!on || nn.length < 3) return false;
      return (
        nn === on ||
        (nn.length >= 4 && on.includes(nn)) ||
        (on.length >= 4 && nn.includes(on))
      );
    });
    const toRevert =
      keepers.length === 1 ? codes.filter((c) => c !== keepers[0]) : codes;
    for (const code of toRevert) {
      const isoName = displayIsoName(
        officialMap.get(code.slice(cc.length + 1)),
      );
      if (isoName === base[code]) continue;
      report.baseNameCollisionsResolved.push({
        country: cc,
        code,
        from: base[code],
        to: isoName,
      });
      base[code] = isoName;
    }
  }
}

// Decide the strip for one name: {stripped} | {skip: reason} | null (not a candidate).
function suffixStripDecision(name) {
  const m = SUFFIX_RE.exec(name);
  if (!m) return null;
  if (SUFFIX_STRIP_EXEMPT.has(name)) return { skip: "exempt" };
  const rest = m[1];
  const tokens = rest.toLowerCase().split(/[\s-]+/).filter(Boolean);
  if (tokens.every((t) => GENERIC_REMAINDER_TOKENS.has(t)))
    return { skip: "generic-remainder" };
  if (COMPOUND_QUALIFIER_TOKENS.has(tokens[tokens.length - 1]))
    return { skip: "qualifier-remainder" };
  return { stripped: rest };
}

// Collision-aware suffix strip. Two-phase: collect candidates, then count the
// post-strip pool (candidates at their STRIPPED value — so two siblings stripping to
// the same name both revert — everything else at its current value), diacritic-
// normalized. Apply only where the stripped name is unique in the pool. A single pass
// suffices: a reverted candidate re-contributes its original name, which was unique
// pre-strip and cannot equal any stripped result (stripping only removes a trailing
// word); the duplicate-effective-names invariant below is the backstop.
function stripAdminSuffixes(cc, base) {
  const candidates = new Map(); // code -> stripped name
  for (const [code, name] of Object.entries(base)) {
    const d = suffixStripDecision(name);
    if (!d) continue;
    if (code in BASE_NAME_OVERRIDES) {
      // Overrides are curated verbatim — load-bearing for pairs like TW Chiayi
      // City/County, where the exact-collision check alone would not protect them.
      report.suffixStripSkipped.push({ country: cc, code, name, reason: "override" });
      continue;
    }
    if (d.skip) {
      report.suffixStripSkipped.push({ country: cc, code, name, reason: d.skip });
      continue;
    }
    candidates.set(code, d.stripped);
  }
  if (candidates.size === 0) return;
  const counts = new Map();
  for (const [code, name] of Object.entries(base)) {
    const k = normalize(candidates.get(code) ?? name);
    if (k) counts.set(k, (counts.get(k) || 0) + 1);
  }
  for (const [code, stripped] of candidates) {
    const k = normalize(stripped);
    if (k && counts.get(k) === 1) {
      report.suffixesStripped.total++;
      report.suffixesStripped.byCountry[cc] =
        (report.suffixesStripped.byCountry[cc] || 0) + 1;
      base[code] = stripped;
    } else {
      report.suffixStripSkipped.push({
        country: cc,
        code,
        name: base[code],
        reason: "collision",
      });
    }
  }
}

function resolveLocalizedCollisions(cc, base, localized) {
  const codes = Object.keys(base);
  for (const lang of LOCALIZED_LANGS) {
    const layer = localized[lang];
    let changed = true;
    while (changed) {
      changed = false;
      for (const [, group] of groupCodesByName(
        codes,
        (c) => layer[c] ?? base[c],
      )) {
        if (group.length < 2) continue;
        for (const code of group) {
          if (layer[code] === undefined) continue;
          report.localizedEntriesDropped.push({
            country: cc,
            lang,
            code,
            droppedName: layer[code],
          });
          delete layer[code];
          changed = true;
        }
      }
    }
  }
}

function collectDuplicateEffectiveNames(cc, base, localized) {
  const violations = [];
  const codes = Object.keys(base);
  for (const lang of LANGS) {
    const layer = lang === "en" ? {} : localized[lang];
    for (const [name, group] of groupCodesByName(
      codes,
      (c) => layer[c] ?? base[c],
    )) {
      if (group.length > 1)
        violations.push({ country: cc, lang, name, codes: group });
    }
  }
  return violations;
}

// ---- build ----
const countriesOut = {};
const countriesLocalized = Object.fromEntries(
  LOCALIZED_LANGS.map((l) => [l, {}]),
);
const report = {
  generatedFrom:
    "iso-3166 (region set + codes) + esosedi/3166 (localized names, MIT)",
  langs: LANGS,
  codeFormat: "ISO 3166-2 full code (e.g. ES-AN)",
  granularity: "complete ISO 3166-2 (all subdivision levels)",
  methodCounts: {},
  unmappedEsosediRegions: [], // esosedi regions that don't map to any official ISO 3166-2 code
  baseNameCollisionsResolved: [], // base names reverted to ISO canonical to break collisions
  suffixesStripped: { total: 0, byCountry: {} }, // renames visible in the data/states diff
  suffixStripSkipped: [], // {country, code, name, reason: override|exempt|generic-remainder|qualifier-remainder|collision}
  localizedEntriesDropped: [], // localized entries dropped (collided within their language)
};
const bump = (m) =>
  (report.methodCounts[m] = (report.methodCounts[m] || 0) + 1);

fs.rmSync(path.join(DATA_DIR, "states"), { recursive: true, force: true });
fs.rmSync(path.join(DATA_DIR, "states-localized"), {
  recursive: true,
  force: true,
});
fs.mkdirSync(path.join(DATA_DIR, "states"), { recursive: true });
fs.mkdirSync(path.join(DATA_DIR, "states-localized"), { recursive: true });

const enDb = i18n.en;
let statesFiles = 0,
  regionsTotal = 0,
  localizedRegions = 0;
const duplicateViolations = [];

// Aggregates for the eager, browser-safe bundle consumed by the `compat` entry point.
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
    const names = regionNamesAllLangs(cc, r.iso);
    const { code, method } = resolveOfficialCode(
      cc,
      r.iso,
      names,
      officialMap,
      usedOfficial,
    );
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
    base[fullCode] =
      BASE_NAME_OVERRIDES[fullCode] ?? ((names && names.en) || isoName);
    regionsTotal++;
    if (names) {
      let any = false;
      for (const lang of LOCALIZED_LANGS) {
        if (names[lang]) {
          localized[lang][fullCode] = names[lang];
          any = true;
        }
      }
      if (any) localizedRegions++;
    }
    // Apply curated localized-name overrides (runs even when esosedi has no entry).
    for (const lang of LOCALIZED_LANGS) {
      const override = LOCALIZED_NAME_OVERRIDES[lang]?.[fullCode];
      if (override) localized[lang][fullCode] = override;
    }
  }

  resolveBaseNameCollisions(cc, base, officialMap);
  stripAdminSuffixes(cc, base);
  resolveLocalizedCollisions(cc, base, localized);
  duplicateViolations.push(
    ...collectDuplicateEffectiveNames(cc, base, localized),
  );

  fs.writeFileSync(
    path.join(DATA_DIR, "states", `${cc}.json`),
    JSON.stringify(base, null, 2) + "\n",
  );
  const localizedClean = Object.fromEntries(
    Object.entries(localized).filter(([, v]) => Object.keys(v).length),
  );
  fs.writeFileSync(
    path.join(DATA_DIR, "states-localized", `${cc}.json`),
    JSON.stringify(localizedClean, null, 2) + "\n",
  );
  allStates[cc] = base;
  allStatesLocalized[cc] = localizedClean;
  statesFiles++;
}

if (duplicateViolations.length) {
  console.error(
    "DUPLICATE EFFECTIVE SUBDIVISION NAMES — add the codes to BASE_NAME_OVERRIDES or fix the upstream mapping:",
  );
  for (const v of duplicateViolations) {
    console.error(
      `  ${v.country} [${v.lang}] "${v.name}": ${v.codes.join(", ")}`,
    );
  }
  process.exit(1);
}

fs.writeFileSync(
  path.join(DATA_DIR, "countries.json"),
  JSON.stringify(countriesOut, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(DATA_DIR, "countries-localized.json"),
  JSON.stringify(countriesLocalized, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(DATA_DIR, "reconciliation-report.json"),
  JSON.stringify(report, null, 2) + "\n",
);

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
console.log(
  "state files:",
  statesFiles,
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
