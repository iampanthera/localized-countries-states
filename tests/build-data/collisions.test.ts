import {
  groupCodesByName,
  resolveBaseNameCollisions,
  resolveLocalizedCollisions,
  collectDuplicateEffectiveNames,
} from "../../scripts/lib/collisions.mjs";

function emptyReport() {
  return {
    baseNameCollisionsResolved: [] as object[],
    localizedEntriesDropped: [] as object[],
  };
}

describe("groupCodesByName", () => {
  it("groups codes by their effective name", () => {
    const byName = groupCodesByName(["A", "B", "C"], (c: string) => (c === "C" ? "x" : "same"));
    expect(byName.get("same")).toEqual(["A", "B"]);
    expect(byName.get("x")).toEqual(["C"]);
  });
});

describe("resolveBaseNameCollisions", () => {
  it("keeps the code whose ISO name matches and reverts the others", () => {
    const base = { "XX-A": "Foo", "XX-B": "Foo" };
    const officialMap = new Map([
      ["A", "Foo"],
      ["B", "Bar, Republic of"],
    ]);
    const report = emptyReport();
    resolveBaseNameCollisions("XX", base, officialMap, report);
    expect(base).toEqual({ "XX-A": "Foo", "XX-B": "Republic of Bar" });
    expect(report.baseNameCollisionsResolved).toEqual([
      { country: "XX", code: "XX-B", from: "Foo", to: "Republic of Bar" },
    ]);
  });

  it("reverts all codes when no ISO name matches the collided name", () => {
    const base = { "XX-A": "Foo", "XX-B": "Foo" };
    const officialMap = new Map([
      ["A", "Alpha"],
      ["B", "Beta"],
    ]);
    resolveBaseNameCollisions("XX", base, officialMap, emptyReport());
    expect(base).toEqual({ "XX-A": "Alpha", "XX-B": "Beta" });
  });

  it("leaves unique names untouched", () => {
    const base = { "XX-A": "Foo", "XX-B": "Bar" };
    const officialMap = new Map([
      ["A", "Alpha"],
      ["B", "Beta"],
    ]);
    resolveBaseNameCollisions("XX", base, officialMap, emptyReport());
    expect(base).toEqual({ "XX-A": "Foo", "XX-B": "Bar" });
  });
});

describe("resolveLocalizedCollisions", () => {
  it("drops localized entries that collide within their language", () => {
    const base = { "XX-A": "Alpha", "XX-B": "Beta" };
    const localized = { fr: { "XX-A": "Même", "XX-B": "Même" } };
    const report = emptyReport();
    resolveLocalizedCollisions("XX", base, localized, ["fr"], report);
    expect(localized.fr).toEqual({});
    expect(report.localizedEntriesDropped).toHaveLength(2);
  });

  it("drops a localized entry that collides with another code's base fallback", () => {
    const base = { "XX-A": "Alpha", "XX-B": "Beta" };
    const localized = { fr: { "XX-A": "Beta" } };
    const report = emptyReport();
    resolveLocalizedCollisions("XX", base, localized, ["fr"], report);
    expect(localized.fr).toEqual({});
    expect(report.localizedEntriesDropped).toHaveLength(1);
  });

  it("keeps distinct localized names", () => {
    const base = { "XX-A": "Alpha", "XX-B": "Beta" };
    const localized = { fr: { "XX-A": "Alphe", "XX-B": "Bète" } };
    resolveLocalizedCollisions("XX", base, localized, ["fr"], emptyReport());
    expect(localized.fr).toEqual({ "XX-A": "Alphe", "XX-B": "Bète" });
  });
});

describe("collectDuplicateEffectiveNames", () => {
  it("flags duplicates in the base (en) layer", () => {
    const violations = collectDuplicateEffectiveNames(
      "XX",
      { "XX-A": "Same", "XX-B": "Same" },
      {},
      ["en"],
    );
    expect(violations).toEqual([
      { country: "XX", lang: "en", name: "Same", codes: ["XX-A", "XX-B"] },
    ]);
  });

  it("flags a localized entry colliding with a base fallback", () => {
    const violations = collectDuplicateEffectiveNames(
      "XX",
      { "XX-A": "Alpha", "XX-B": "Beta" },
      { fr: { "XX-A": "Beta" } },
      ["en", "fr"],
    );
    expect(violations).toEqual([
      { country: "XX", lang: "fr", name: "Beta", codes: ["XX-A", "XX-B"] },
    ]);
  });

  it("returns nothing when all effective names are unique", () => {
    expect(
      collectDuplicateEffectiveNames("XX", { "XX-A": "Alpha", "XX-B": "Beta" }, {}, ["en"]),
    ).toEqual([]);
  });
});
