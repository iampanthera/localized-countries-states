import { resolveOfficialCode, regionNamesAllLangs } from "../../scripts/lib/reconcile.mjs";

describe("resolveOfficialCode", () => {
  const officialMap = new Map([
    ["AN", "Andalucía"],
    ["CT", "Catalunya"],
    ["MD", "Madrid, Comunidad de"],
  ]);

  it("matches directly on the code", () => {
    expect(resolveOfficialCode("AN", { en: "Andalusia" }, officialMap, new Set())).toEqual({
      code: "AN",
      method: "code",
    });
  });

  it("skips a direct code match already claimed by another region", () => {
    const result = resolveOfficialCode("AN", { en: "Zzzz" }, officialMap, new Set(["AN"]));
    expect(result).toEqual({ code: null, method: "dropped-non-iso" });
  });

  it("matches on normalized-name containment", () => {
    const result = resolveOfficialCode("99", { en: "Madrid" }, officialMap, new Set());
    expect(result).toEqual({ code: "MD", method: "name" });
  });

  it("falls back to fuzzy matching at ratio >= 0.82", () => {
    const result = resolveOfficialCode("99", { en: "Cataluna" }, officialMap, new Set());
    expect(result.code).toBe("CT");
    expect(result.method).toMatch(/^fuzzy\(0\.\d\d\)$/);
  });

  it("drops regions that map to no official code", () => {
    const result = resolveOfficialCode("99", { en: "Atlantis" }, officialMap, new Set());
    expect(result).toEqual({ code: null, method: "dropped-non-iso" });
  });
});

describe("regionNamesAllLangs", () => {
  const i18n = {
    en: { ES: { name: "Spain", regions: [{ iso: "AN", name: "Andalusia" }] } },
    fr: { ES: { name: "Espagne", regions: [{ iso: "AN", name: "Andalousie" }] } },
    zh: { ES: { name: "西班牙", regions: [{ iso: "AN", name: "китайский" }] } }, // contaminated
    de: {}, // country missing entirely
  };

  it("collects names per language, filtering invalid entries", () => {
    expect(regionNamesAllLangs(i18n, ["en", "fr", "zh", "de"], "ES", "AN")).toEqual({
      en: "Andalusia",
      fr: "Andalousie",
    });
  });

  it("returns an empty object for unknown regions", () => {
    expect(regionNamesAllLangs(i18n, ["en", "fr"], "ES", "XX")).toEqual({});
  });
});
