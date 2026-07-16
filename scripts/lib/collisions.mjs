// Duplicate-name resolution.
// Effective display names must be unique per (country, language) — two identical
// entries in an address dropdown are indistinguishable. Base collisions caused by
// esosedi collapsing two distinct ISO names are reverted to the ISO canonical name;
// localized-layer collisions are dropped so the affected codes fall back to their
// (unique) English base. Pairs where ISO itself repeats a name are handled up front
// by BASE_NAME_OVERRIDES; anything unresolvable fails the build (invariant checked
// by the caller via collectDuplicateEffectiveNames).

import { normalize, displayIsoName } from "./text.mjs";

export function groupCodesByName(codes, nameOf) {
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
export function resolveBaseNameCollisions(cc, base, officialMap, report) {
  for (const [name, codes] of groupCodesByName(Object.keys(base), (c) => base[c])) {
    if (codes.length < 2) continue;
    const nn = normalize(name);
    const keepers = codes.filter((code) => {
      const on = normalize(officialMap.get(code.slice(cc.length + 1)));
      if (!on || nn.length < 3) return false;
      return (
        nn === on || (nn.length >= 4 && on.includes(nn)) || (on.length >= 4 && nn.includes(on))
      );
    });
    const toRevert = keepers.length === 1 ? codes.filter((c) => c !== keepers[0]) : codes;
    for (const code of toRevert) {
      const isoName = displayIsoName(officialMap.get(code.slice(cc.length + 1)));
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

// Drop localized entries that collide within their language layer; affected codes
// fall back to their (unique) English base name.
export function resolveLocalizedCollisions(cc, base, localized, localizedLangs, report) {
  const codes = Object.keys(base);
  for (const lang of localizedLangs) {
    const layer = localized[lang];
    let changed = true;
    while (changed) {
      changed = false;
      for (const [, group] of groupCodesByName(codes, (c) => layer[c] ?? base[c])) {
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

export function collectDuplicateEffectiveNames(cc, base, localized, langs) {
  const violations = [];
  const codes = Object.keys(base);
  for (const lang of langs) {
    const layer = lang === "en" ? {} : localized[lang];
    for (const [name, group] of groupCodesByName(codes, (c) => layer[c] ?? base[c])) {
      if (group.length > 1) violations.push({ country: cc, lang, name, codes: group });
    }
  }
  return violations;
}
