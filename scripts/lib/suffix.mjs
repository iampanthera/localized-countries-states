// Administrative-type suffix stripping.
// Trailing English administrative-type words are removed from base names ("Aomori
// Prefecture" -> "Aomori") to match ISO style and keep dropdowns clean. Deliberately
// NOT included: City, Territory (part of the proper name: "Mexico City", "Northern
// Territory"); Krai/Okrug/Republic (transliterated or conventional English: "Altai
// Krai", "Komi Republic"); Voivodeship (PL remainders are bare adjectives: "Masovian").

import { normalize } from "./text.mjs";

export const STRIPPABLE_SUFFIXES = [
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
export const SUFFIX_RE = new RegExp(`^(.*\\S) (?:${STRIPPABLE_SUFFIXES.join("|")})$`);

// Keep the suffix when the remainder is purely directional/generic — "Northern
// Province" (LK), "Capital Region" (IS), "Far North Region" (CM), "Free State" (ZA),
// "Centre-Est Region" (BF). Includes French directionals used in BF/CM/TD names.
export const GENERIC_REMAINDER_TOKENS = new Set([
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
export const COMPOUND_QUALIFIER_TOKENS = new Set([
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
export const SUFFIX_STRIP_EXEMPT = new Set([
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

// Decide the strip for one name: {stripped} | {skip: reason} | null (not a candidate).
export function suffixStripDecision(name) {
  const m = SUFFIX_RE.exec(name);
  if (!m) return null;
  if (SUFFIX_STRIP_EXEMPT.has(name)) return { skip: "exempt" };
  const rest = m[1];
  const tokens = rest
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean);
  if (tokens.every((t) => GENERIC_REMAINDER_TOKENS.has(t))) return { skip: "generic-remainder" };
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
// word); the duplicate-effective-names invariant is the backstop.
// `overrides` holds curated verbatim names (BASE_NAME_OVERRIDES) that must never strip.
export function stripAdminSuffixes(cc, base, overrides, report) {
  const candidates = new Map(); // code -> stripped name
  for (const [code, name] of Object.entries(base)) {
    const d = suffixStripDecision(name);
    if (!d) continue;
    if (code in overrides) {
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
      report.suffixesStripped.byCountry[cc] = (report.suffixesStripped.byCountry[cc] || 0) + 1;
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
