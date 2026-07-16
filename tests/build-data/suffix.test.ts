import { suffixStripDecision, stripAdminSuffixes } from "../../scripts/lib/suffix.mjs";

function emptyReport() {
  return {
    suffixesStripped: { total: 0, byCountry: {} as Record<string, number> },
    suffixStripSkipped: [] as { country: string; code: string; name: string; reason: string }[],
  };
}

describe("suffixStripDecision", () => {
  it("strips a plain administrative suffix", () => {
    expect(suffixStripDecision("Aomori Prefecture")).toEqual({ stripped: "Aomori" });
    expect(suffixStripDecision("Gharbia Governorate")).toEqual({ stripped: "Gharbia" });
  });

  it("returns null for names without a strippable suffix", () => {
    expect(suffixStripDecision("Bavaria")).toBeNull();
    expect(suffixStripDecision("Mexico City")).toBeNull(); // City deliberately not strippable
  });

  it("skips curated exemptions", () => {
    expect(suffixStripDecision("South Bohemian Region")).toEqual({ skip: "exempt" });
  });

  it("skips purely directional/generic remainders", () => {
    expect(suffixStripDecision("Northern Province")).toEqual({ skip: "generic-remainder" });
    expect(suffixStripDecision("Free State")).toEqual({ skip: "generic-remainder" });
    expect(suffixStripDecision("Centre-Est Region")).toEqual({ skip: "generic-remainder" });
  });

  it("skips compound-qualifier remainders", () => {
    expect(suffixStripDecision("Jewish Autonomous Oblast")).toEqual({
      skip: "qualifier-remainder",
    });
    expect(suffixStripDecision("Santiago Metropolitan Region")).toEqual({
      skip: "qualifier-remainder",
    });
  });
});

describe("stripAdminSuffixes", () => {
  it("strips suffixes when the result is unique", () => {
    const base = { "JP-02": "Aomori Prefecture", "JP-03": "Iwate Prefecture" };
    const report = emptyReport();
    stripAdminSuffixes("JP", base, {}, report);
    expect(base).toEqual({ "JP-02": "Aomori", "JP-03": "Iwate" });
    expect(report.suffixesStripped.total).toBe(2);
    expect(report.suffixesStripped.byCountry.JP).toBe(2);
  });

  it("reverts both siblings that would strip to the same name", () => {
    const base = { "XX-1": "Foo Province", "XX-2": "Foo District" };
    const report = emptyReport();
    stripAdminSuffixes("XX", base, {}, report);
    expect(base).toEqual({ "XX-1": "Foo Province", "XX-2": "Foo District" });
    expect(report.suffixStripSkipped.map((s) => s.reason)).toEqual(["collision", "collision"]);
  });

  it("keeps the suffix when the stripped name collides with an existing sibling", () => {
    const base = { "XX-1": "Foo Province", "XX-2": "Foo" };
    const report = emptyReport();
    stripAdminSuffixes("XX", base, {}, report);
    expect(base["XX-1"]).toBe("Foo Province");
  });

  it("detects collisions across diacritics", () => {
    const base = { "XX-1": "Plzeň Province", "XX-2": "Plzen" };
    const report = emptyReport();
    stripAdminSuffixes("XX", base, {}, report);
    expect(base["XX-1"]).toBe("Plzeň Province");
  });

  it("never strips curated override names", () => {
    const base = { "TW-CYI": "Chiayi City", "BD-H": "Mymensingh Division" };
    const report = emptyReport();
    stripAdminSuffixes("BD", base, { "BD-H": "Mymensingh Division" }, report);
    expect(base["BD-H"]).toBe("Mymensingh Division");
    expect(report.suffixStripSkipped).toEqual([
      { country: "BD", code: "BD-H", name: "Mymensingh Division", reason: "override" },
    ]);
  });
});
