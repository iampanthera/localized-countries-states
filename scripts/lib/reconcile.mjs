// Reconciling esosedi regions onto official ISO 3166-2 codes.

import { normalize, ratio } from "./text.mjs";
import { isValidLocalizedName } from "./validate.mjs";

// Collect every name we know for a db region, across all langs, by matching the region iso within each lang file.
export function regionNamesAllLangs(i18n, langs, cc, dbRegionIso) {
  const names = {};
  for (const lang of langs) {
    const entry = i18n[lang][cc];
    if (!entry || !entry.regions) continue;
    const r = entry.regions.find((x) => x.iso === dbRegionIso);
    if (r && r.name && isValidLocalizedName(lang, r.name)) names[lang] = r.name;
  }
  return names;
}

// Resolve one db region -> official subdivision code.
export function resolveOfficialCode(dbIso, names, officialMap, usedOfficial) {
  // 1. direct code match
  if (officialMap.has(dbIso) && !usedOfficial.has(dbIso)) {
    return { code: dbIso, method: "code" };
  }
  const candidateNames = [...new Set(Object.values(names).concat(dbIso).map(normalize))].filter(
    Boolean,
  );

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
