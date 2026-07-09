import {
  init,
  getAllCountries,
  getStatesOfCountry,
  getCountryName,
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
  getAvailableCountryLocales,
  hasLocalizedCountries,
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

  it('getStatesOfCountry("PK") returns official ISO 3166-2 subdivisions', () => {
    const states = getStatesOfCountry("PK");
    expect(states.length).toBeGreaterThanOrEqual(4);
    expect(states.find((s) => s.code === "PK-PB" && s.name === "Punjab")).toBeDefined();
    expect(states.find((s) => s.code === "PK-SD" && s.name === "Sindh")).toBeDefined();
  });

  it('getStatesOfCountry("ES") uses full ISO 3166-2 codes and localizes across languages', () => {
    const en = getStatesOfCountry("ES");
    // Complete ISO 3166-2 set (autonomous communities + provinces)
    expect(en.length).toBeGreaterThanOrEqual(60);
    expect(en.find((s) => s.code === "ES-CT" && s.name === "Catalonia")).toBeDefined();
    expect(en.find((s) => s.code === "ES-AN" && s.name === "Andalusia")).toBeDefined();
    expect(en.find((s) => s.code === "ES-A" && s.name === "Alicante")).toBeDefined(); // province
    // localized overlays (keyed by language, resolved via BCP-47 fallback)
    const fr = getStatesOfCountry("ES", "fr-FR");
    expect(fr.find((s) => s.code === "ES-CT")!.name).toBe("Catalogne");
    const es = getStatesOfCountry("ES", "es-ES");
    expect(es.find((s) => s.code === "ES-CT")!.name).toBe("Cataluña");
    // province with no esosedi translation falls back to the base name
    expect(es.find((s) => s.code === "ES-A")!.name).toBe("Alicante");
    // dropped upstream-contaminated zh entry falls back to the English base
    const zh = getStatesOfCountry("ES", "zh");
    expect(zh.find((s) => s.code === "ES-AN")!.name).toBe("Andalusia");
  });

  it('getStatesOfCountry("US") returns all US states', () => {
    const states = getStatesOfCountry("US");
    expect(states.length).toBeGreaterThan(50);
    expect(
      states.find((s) => s.code === "US-CA" && s.name === "California")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "US-NY" && s.name === "New York")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "US-TX" && s.name === "Texas")
    ).toBeDefined();
  });

  it('getStatesOfCountry("CA") returns Canadian provinces', () => {
    const states = getStatesOfCountry("CA");
    expect(
      states.find((s) => s.code === "CA-ON" && s.name === "Ontario")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "CA-QC" && s.name === "Quebec")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "CA-BC" && s.name === "British Columbia")
    ).toBeDefined();
  });

  it('getStatesOfCountry("IN") returns Indian states', () => {
    const states = getStatesOfCountry("IN");
    expect(
      states.find((s) => s.code === "IN-MH" && s.name === "Maharashtra")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "IN-DL" && s.name === "Delhi")
    ).toBeDefined();
    expect(
      states.find((s) => s.code === "IN-KA" && s.name === "Karnataka")
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

  it("getAllCountries returns names sorted alphabetically for the locale", () => {
    const en = getAllCountries("en-US");
    const collator = new Intl.Collator("en-US");
    const sorted = [...en].sort((a, b) => collator.compare(a.name, b.name));
    expect(en.map((c) => c.name)).toEqual(sorted.map((c) => c.name));

    const es = getAllCountries("es-ES");
    const esCollator = new Intl.Collator("es-ES");
    const esSorted = [...es].sort((a, b) => esCollator.compare(a.name, b.name));
    expect(es.map((c) => c.name)).toEqual(esSorted.map((c) => c.name));
  });

  it("getStatesOfCountry returns names sorted alphabetically for the locale", () => {
    const us = getStatesOfCountry("US");
    const collator = new Intl.Collator();
    const usSorted = [...us].sort((a, b) => collator.compare(a.name, b.name));
    expect(us.map((s) => s.name)).toEqual(usSorted.map((s) => s.name));
    // Alabama before Alaska (name order, not code order US-AK before US-AL)
    expect(us.findIndex((s) => s.name === "Alabama")).toBeLessThan(
      us.findIndex((s) => s.name === "Alaska")
    );

    const es = getStatesOfCountry("ES", "es-ES");
    const esCollator = new Intl.Collator("es-ES");
    const esSorted = [...es].sort((a, b) => esCollator.compare(a.name, b.name));
    expect(es.map((s) => s.name)).toEqual(esSorted.map((s) => s.name));
  });

  it("returns empty array for countries without state data", () => {
    const states = getStatesOfCountry("XX");
    expect(states).toEqual([]);
  });

  describe("localization", () => {
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
      expect(getStateName("US", "US-CA")).toBe("California");
      expect(getStateName("US", "US-NY")).toBe("New York");
      // Spanish localization via full ISO 3166-2 code
      expect(getStateName("US", "US-NY", "es-ES")).toBe("Nueva York");
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

    it("getAvailableCountryLocales returns available locales", () => {
      const locales = getAvailableCountryLocales();
      expect(Array.isArray(locales)).toBe(true);
      expect(locales.length).toBeGreaterThan(0);
    });

    it("hasLocalizedCountries checks for localized country availability", () => {
      expect(hasLocalizedCountries("es-ES")).toBe(true);
      expect(hasLocalizedCountries("fr-FR")).toBe(true);
      expect(hasLocalizedCountries("de-DE")).toBe(true);
      expect(hasLocalizedCountries("invalid")).toBe(false);
    });

    it("getCountryName uses localized data when available", () => {
      // Test with Spanish
      const spanishName = getCountryName("US", "es-ES");
      expect(spanishName).toBe("Estados Unidos");

      // Test with French
      const frenchName = getCountryName("DE", "fr-FR");
      expect(frenchName).toBe("Allemagne");

      // Test with German
      const germanName = getCountryName("FR", "de-DE");
      expect(germanName).toBe("Frankreich");
    });

    it("getAllCountries uses localized data when available", () => {
      const spanishCountries = getAllCountries("es-ES");
      const us = spanishCountries.find((c) => c.code === "US");
      expect(us?.name).toBe("Estados Unidos");

      const frenchCountries = getAllCountries("fr-FR");
      const de = frenchCountries.find((c) => c.code === "DE");
      expect(de?.name).toBe("Allemagne");
    });
  });
});
