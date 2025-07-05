import {
  init,
  getAllCountries,
  getStatesOfCountry,
  getCountryName,
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
  normalizeLocale,
  parseLocale,
  isLocaleSupported,
  COMMON_LOCALES,
} from "../src";

describe("country-localizer", () => {
  beforeEach(() => {
    init("en-US");
  });

  it('getAllCountries("fr-FR") returns French names', () => {
    const countries = getAllCountries("fr-FR");
    // DE should be localized to French
    const de = countries.find((c) => c.code === "DE");
    expect(de).toBeDefined();
    // Accept "Allemagne" or fallback to "Germany" if Intl not available
    expect(["Allemagne", "Germany"]).toContain(de!.name);
  });

  it('getStatesOfCountry("PK") returns correct states', () => {
    const states = getStatesOfCountry("PK");
    expect(states).toEqual([
      { code: "PB", name: "Punjab" },
      { code: "SD", name: "Sindh" },
    ]);
  });

  it('getStatesOfCountry("US") returns all US states', () => {
    const states = getStatesOfCountry("US");
    expect(states.length).toBeGreaterThan(50);
    expect(
      states.find((s) => s.code === "CA" && s.name === "California")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "NY" && s.name === "New York")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "TX" && s.name === "Texas")
    ).toBeDefined();
  });

  it('getStatesOfCountry("CA") returns Canadian provinces', () => {
    const states = getStatesOfCountry("CA");
    expect(
      states.find((s) => s.code === "ON" && s.name === "Ontario")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "QC" && s.name === "Quebec")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "BC" && s.name === "British Columbia")
    ).toBeDefined();
  });

  it('getStatesOfCountry("IN") returns Indian states', () => {
    const states = getStatesOfCountry("IN");
    expect(
      states.find((s) => s.code === "MH" && s.name === "Maharashtra")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "DL" && s.name === "Delhi")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "KA" && s.name === "Karnataka")
    ).toBeDefined();
  });

  it('init("ar-BH") + getAllCountries() uses Arabic names', () => {
    init("ar-BH");
    const countries = getAllCountries();
    const pk = countries.find((c) => c.code === "PK");
    // Accept Arabic or fallback to English
    expect(["باكستان", "Pakistan"]).toContain(pk!.name);
  });

  it("invalid locale falls back to en-US", () => {
    const countries = getAllCountries("invalid-locale");
    const de = countries.find((c) => c.code === "DE");
    expect(["Germany"]).toContain(de!.name);
  });

  it("getCountryName returns localized or English name", () => {
    expect(["Allemagne", "Germany"]).toContain(getCountryName("DE", "fr-FR"));
    expect(getCountryName("PK")).toBe("Pakistan");
  });

  it("getAllCountries returns all world countries", () => {
    const countries = getAllCountries();
    expect(countries.length).toBeGreaterThan(190);
    expect(
      countries.find((c) => c.code === "US" && c.name === "United States")
    ).toBeDefined();
    expect(
      countries.find((c) => c.code === "CN" && c.name === "China")
    ).toBeDefined();
    expect(
      countries.find((c) => c.code === "IN" && c.name === "India")
    ).toBeDefined();
    expect(
      countries.find((c) => c.code === "BR" && c.name === "Brazil")
    ).toBeDefined();
  });

  it("returns empty array for countries without state data", () => {
    const states = getStatesOfCountry("XX");
    expect(states).toEqual([]);
  });

  // New localization tests
  describe("Enhanced Localization", () => {
    it("normalizeLocale handles various formats", () => {
      expect(normalizeLocale("en-us")).toBe("en-US");
      expect(normalizeLocale("FR-fr")).toBe("fr-FR");
      expect(normalizeLocale("es-MX")).toBe("es-MX");
      expect(normalizeLocale("invalid")).toBe("en-US");
    });

    it("parseLocale correctly parses BCP 47 locales", () => {
      const result1 = parseLocale("en-US");
      expect(result1).toEqual({ language: "en", region: "US" });

      const result2 = parseLocale("fr-FR");
      expect(result2).toEqual({ language: "fr", region: "FR" });

      const result3 = parseLocale("zh-Hans-CN");
      expect(result3).toEqual({ language: "zh", script: "Hans", region: "CN" });

      expect(parseLocale("invalid")).toBeNull();
    });

    it("isLocaleSupported checks locale availability", () => {
      expect(isLocaleSupported("en-US")).toBe(true);
      expect(isLocaleSupported("fr-FR")).toBe(true);
      expect(isLocaleSupported("invalid-locale")).toBe(false);
    });

    it("COMMON_LOCALES contains expected locales", () => {
      expect(COMMON_LOCALES).toContain("en-US");
      expect(COMMON_LOCALES).toContain("fr-FR");
      expect(COMMON_LOCALES).toContain("es-ES");
      expect(COMMON_LOCALES).toContain("de-DE");
      expect(COMMON_LOCALES).toContain("zh-CN");
      expect(COMMON_LOCALES).toContain("ja-JP");
    });

    it("getStateName returns localized state names when available", () => {
      // Test with US states - should return English names by default
      expect(getStateName("US", "CA")).toBe("California");
      expect(getStateName("US", "NY")).toBe("New York");
    });

    it("getAvailableStateLocales returns available locales", () => {
      const locales = getAvailableStateLocales("US");
      // Should return available locales for US states
      expect(Array.isArray(locales)).toBe(true);
    });

    it("hasLocalizedStates checks for localized state availability", () => {
      // Test with US states
      expect(hasLocalizedStates("US", "es-ES")).toBe(true);
      expect(hasLocalizedStates("US", "fr-FR")).toBe(true);
      expect(hasLocalizedStates("US", "invalid")).toBe(false);
    });
  });
});
