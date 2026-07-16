import {
  resolveLocale,
  resolveCountryName,
  resolveStateName,
  toFullStateCode,
} from "../src/core/resolve.js";

describe("resolveLocale", () => {
  it("returns undefined for no locale", () => {
    expect(resolveLocale()).toBeUndefined();
    expect(resolveLocale("")).toBeUndefined();
  });

  it("normalizes and splits out the language", () => {
    expect(resolveLocale("FR-fr")).toEqual({ normalized: "fr-FR", language: "fr" });
    expect(resolveLocale("zh")).toEqual({ normalized: "zh", language: "zh" });
  });

  it("falls back to en-US for garbage input (normalizeLocale contract)", () => {
    expect(resolveLocale("not_a_locale")).toEqual({ normalized: "en-US", language: "en" });
  });
});

describe("resolveCountryName", () => {
  it("resolves a full locale through its language-keyed bundled layer", () => {
    expect(resolveCountryName("DE", resolveLocale("fr-FR"))).toBe("Allemagne");
    expect(resolveCountryName("DE", resolveLocale("fr"))).toBe("Allemagne");
  });

  it("falls back to Intl.DisplayNames for unbundled languages", () => {
    // Korean is not in the bundle; Intl supplies it (or English base as last resort)
    expect(["독일", "Germany"]).toContain(resolveCountryName("DE", resolveLocale("ko-KR")));
  });

  it("returns the base English name without a locale", () => {
    expect(resolveCountryName("DE")).toBe("Germany");
  });

  it("returns undefined for unknown countries", () => {
    expect(resolveCountryName("XX")).toBeUndefined();
    expect(resolveCountryName("XX", resolveLocale("fr-FR"))).toBeUndefined();
  });
});

describe("resolveStateName", () => {
  it("resolves through the country's language-keyed layer", () => {
    expect(resolveStateName("ES", "ES-CT", resolveLocale("fr-FR"))).toBe("Catalogne");
  });

  it("falls back to the base name for unbundled languages", () => {
    expect(resolveStateName("ES", "ES-CT", resolveLocale("ko-KR"))).toBe("Catalonia");
  });

  it("returns undefined for unknown subdivisions", () => {
    expect(resolveStateName("ES", "ES-XX")).toBeUndefined();
    expect(resolveStateName("XX", "XX-1")).toBeUndefined();
  });
});

describe("toFullStateCode", () => {
  it("prefixes bare codes and passes full codes through", () => {
    expect(toFullStateCode("US", "CA")).toBe("US-CA");
    expect(toFullStateCode("US", "US-CA")).toBe("US-CA");
    expect(toFullStateCode("US", "ca")).toBe("US-CA");
  });
});
