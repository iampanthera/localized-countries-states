import {
  init,
  getAllCountries,
  getCountry,
  getStatesOfCountry,
  getAllStates,
  getCountryName,
  getState,
  getStateName,
  getAvailableStateLocales,
  hasLocalizedStates,
  getAvailableCountryLocales,
  hasLocalizedCountries,
  createLocalizedData,
  normalizeLocale,
  parseLocale,
  isLocaleSupported,
  COMMON_LOCALES,
} from "../src/index.js";

describe("localized-countries-states", () => {
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
    expect(states.find((s) => s.code === "US-CA" && s.name === "California")).toBeDefined();
    expect(states.find((s) => s.code === "US-NY" && s.name === "New York")).toBeDefined();
    expect(states.find((s) => s.code === "US-TX" && s.name === "Texas")).toBeDefined();
  });

  it('getStatesOfCountry("CA") returns Canadian provinces', () => {
    const states = getStatesOfCountry("CA");
    expect(states.find((s) => s.code === "CA-ON" && s.name === "Ontario")).toBeDefined();
    expect(states.find((s) => s.code === "CA-QC" && s.name === "Quebec")).toBeDefined();
    expect(states.find((s) => s.code === "CA-BC" && s.name === "British Columbia")).toBeDefined();
  });

  it('getStatesOfCountry("IN") returns Indian states', () => {
    const states = getStatesOfCountry("IN");
    expect(states.find((s) => s.code === "IN-MH" && s.name === "Maharashtra")).toBeDefined();
    expect(states.find((s) => s.code === "IN-DL" && s.name === "Delhi")).toBeDefined();
    expect(states.find((s) => s.code === "IN-KA" && s.name === "Karnataka")).toBeDefined();
  });

  describe("init() sets a site-wide default locale", () => {
    afterEach(() => init()); // clear the default so other tests see English behavior

    it("applies to calls that omit the locale", () => {
      init("fr-FR");
      expect(getCountryName("DE")).toBe("Allemagne");
      expect(getStatesOfCountry("ES").find((s) => s.code === "ES-CT")!.name).toBe("Catalogne");
      expect(getAllCountries().find((c) => c.code === "DE")!.name).toBe("Allemagne");
    });

    it("is overridden by an explicit per-call locale", () => {
      init("fr-FR");
      expect(getCountryName("DE", "es-ES")).toBe("Alemania");
    });

    it("is snapshot by createLocalizedData() at creation time", () => {
      init("fr-FR");
      const data = createLocalizedData();
      expect(data.locale).toBe("fr-FR");
      init();
      expect(data.getCountryName("DE")).toBe("Allemagne"); // instance keeps its locale
      expect(getCountryName("DE")).toBe("Germany"); // module calls follow the cleared default
    });

    it("init() with no argument clears the default", () => {
      init("fr-FR");
      init();
      expect(getCountryName("DE")).toBe("Germany");
    });
  });

  it('createLocalizedData("ar-BH") binds an instance to Arabic', () => {
    const data = createLocalizedData("ar-BH");
    expect(data.locale).toBe("ar-BH");
    const pk = data.getAllCountries().find((c) => c.code === "PK");
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

  it("explicit English locales use conventional names over CLDR forms", () => {
    expect(getCountryName("CZ", "en-US")).toBe("Czech Republic"); // CLDR: "Czechia"
    expect(getCountryName("TR", "en-US")).toBe("Turkey"); // CLDR: "Türkiye"
    expect(getCountryName("PS", "en-GB")).toBe("Palestine");
  });

  it("getAllCountries returns all world countries", () => {
    const countries = getAllCountries();
    expect(countries.length).toBeGreaterThan(190);
    expect(countries.find((c) => c.code === "US" && c.name === "United States")).toBeDefined();
    expect(countries.find((c) => c.code === "CN" && c.name === "China")).toBeDefined();
    expect(countries.find((c) => c.code === "IN" && c.name === "India")).toBeDefined();
    expect(countries.find((c) => c.code === "BR" && c.name === "Brazil")).toBeDefined();
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
    const collator = new Intl.Collator("en"); // no-locale calls sort with an English collator
    const usSorted = [...us].sort((a, b) => collator.compare(a.name, b.name));
    expect(us.map((s) => s.name)).toEqual(usSorted.map((s) => s.name));
    // Alabama before Alaska (name order, not code order US-AK before US-AL)
    expect(us.findIndex((s) => s.name === "Alabama")).toBeLessThan(
      us.findIndex((s) => s.name === "Alaska"),
    );

    const es = getStatesOfCountry("ES", "es-ES");
    const esCollator = new Intl.Collator("es-ES");
    const esSorted = [...es].sort((a, b) => esCollator.compare(a.name, b.name));
    expect(es.map((s) => s.name)).toEqual(esSorted.map((s) => s.name));
  });

  it("getStatesOfCountry('ES') excludes deprecated duplicate codes and has no duplicate names", () => {
    const es = getStatesOfCountry("ES", "es-ES");
    const codes = es.map((s) => s.code);
    expect(codes).not.toContain("ES-PM");
    expect(codes).not.toContain("ES-RI");
    expect(codes).not.toContain("ES-S");
    const names = es.map((s) => s.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes).toEqual([]);
  });

  it("effective state names are unique for every country and language", () => {
    // Mirrors LANGS in scripts/build-data.mjs; undefined exercises the base layer.
    const locales = [
      undefined,
      "en-US",
      "ru-RU",
      "de-DE",
      "fr-FR",
      "es-ES",
      "zh-CN",
      "hi-IN",
      "pt-PT",
      "ja-JP",
      "ar-SA",
      "it-IT",
      "he-IL",
    ];
    for (const { code: cc } of getAllCountries()) {
      for (const locale of locales) {
        const names = getStatesOfCountry(cc, locale).map((s) => s.name);
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        expect(dupes.map((d) => `${cc}/${locale ?? "base"}: ${d}`)).toEqual([]);
      }
    }
  });

  it("disambiguates subdivisions that share an identical ISO 3166-2 name", () => {
    expect(getStateName("TW", "TW-CYI")).toBe("Chiayi City");
    expect(getStateName("TW", "TW-CYQ")).toBe("Chiayi County");
    expect(getStateName("LU", "LU-L")).not.toBe(getStateName("LU", "LU-LU"));
    // esosedi collapses these onto one name; the build falls back to ISO canonical
    expect(getStateName("ES", "ES-O")).toBe("Asturias");
    expect(getStateName("ES", "ES-AS")).toBe("Principado de Asturias");
    expect(getStateName("CZ", "CZ-724")).toBe("Zlín");
    expect(getStateName("CZ", "CZ-72")).not.toBe("Zlín");
    // upstream language-name leak must not surface as a region name
    expect(getStateName("UA", "UA-40", "zh")).not.toBe("Chinese");
    expect(getStateName("UA", "UA-43", "zh")).not.toBe("Chinese");
  });

  it("presents display forms instead of ISO comma-inverted names", () => {
    expect(getStateName("GB", "GB-LND")).toBe("City of London");
    expect(getStateName("GB", "GB-EDH")).toBe("City of Edinburgh");
    expect(getStateName("GB", "GB-VGL")).toBe("Vale of Glamorgan");
    expect(getStateName("IT", "IT-BZ")).toBe("Bolzano");
    // legacy LU districts stay distinct from their same-named cantons
    expect(getStateName("LU", "LU-D")).toBe("Diekirch District");
    expect(getStateName("LU", "LU-DI")).toBe("Diekirch");
    // genuine comma names are untouched
    expect(getStateName("GB", "GB-ABC")).toBe("Armagh City, Banbridge and Craigavon");
  });

  it("remaps esosedi entries onto the right official codes (Murcia, Prague)", () => {
    // the autonomous community carries esosedi's names; the province is bare ISO
    expect(getStateName("ES", "ES-MC")).toBe("Region of Murcia");
    expect(getStateName("ES", "ES-MU")).toBe("Murcia");
    expect(getStateName("ES", "ES-MC", "es-ES")).toBe("Región de Murcia");
    expect(getStateName("ES", "ES-MU", "es-ES")).toBe("Murcia");
    // Prague's translations recovered by the CZ PR -> 10 remap
    expect(getStateName("CZ", "CZ-10")).toBe("Prague");
    expect(getStateName("CZ", "CZ-10", "ru")).toBe("Прага");
    expect(getStateName("CZ", "CZ-10", "es-ES")).toBe("Praga");
  });

  describe("admin-type suffix stripping", () => {
    it("strips trailing administrative-type suffixes", () => {
      expect(getStateName("JP", "JP-02")).toBe("Aomori");
      expect(getStateName("JP", "JP-26")).toBe("Kyoto");
      expect(getStateName("TR", "TR-06")).toBe("Ankara");
      expect(getStateName("RU", "RU-AMU")).toBe("Amur");
      expect(getStateName("NG", "NG-LA")).toBe("Lagos");
      expect(getStateName("MM", "MM-17")).toBe("Shan");
    });

    it("keeps the suffix when stripping would collide with a sibling", () => {
      expect(getStateName("RU", "RU-MOW")).toBe("Moscow");
      expect(getStateName("RU", "RU-MOS")).toBe("Moscow Oblast");
      expect(getStateName("AR", "AR-C")).toBe("Buenos Aires");
      expect(getStateName("AR", "AR-B")).toBe("Buenos Aires Province");
      expect(getStateName("BG", "BG-23")).toBe("Sofia Province");
      expect(getStateName("UZ", "UZ-TO")).toBe("Tashkent Province");
      // both members of a mutual-collision pair survive
      expect(getStateName("LA", "LA-VI")).toBe("Vientiane Province");
      expect(getStateName("LA", "LA-VT")).toBe("Vientiane Prefecture");
    });

    it("never strips City/Territory/Krai/Republic", () => {
      expect(getStateName("MX", "MX-CMX")).toBe("Mexico City");
      expect(getStateName("AU", "AU-NT")).toBe("Northern Territory");
      expect(getStateName("RU", "RU-KDA")).toBe("Krasnodar Krai");
      expect(getStateName("RU", "RU-KO")).toBe("Komi Republic");
    });

    it("keeps generic/directional and compound-designation names intact", () => {
      expect(getStateName("LK", "LK-4")).toBe("Northern Province");
      expect(getStateName("IS", "IS-1")).toBe("Capital Region");
      expect(getStateName("ZA", "ZA-FS")).toBe("Free State");
      expect(getStateName("SD", "SD-NO")).toBe("Northern State");
      expect(getStateName("CM", "CM-EN")).toBe("Far North Region");
      expect(getStateName("TJ", "TJ-GB")).toBe("Gorno-Badakhshan Autonomous Province");
      expect(getStateName("RU", "RU-YEV")).toBe("Jewish Autonomous Oblast");
      // curated exemptions: adjectival remainders can't stand alone
      expect(getStateName("CZ", "CZ-31")).toBe("South Bohemian Region");
      expect(getStateName("BE", "BE-VLG")).toBe("Flemish Region");
    });

    it("drops untranslated English copies from localized layers", () => {
      // upstream ships English strings in ja/pt/hi/he layers; they must fall
      // back to the stripped base, not serve stale "Aomori Prefecture"
      expect(getStateName("JP", "JP-02", "ja")).toBe("Aomori");
      expect(getStateName("JP", "JP-02", "pt")).toBe("Aomori");
      expect(getStateName("JP", "JP-02", "hi")).toBe("Aomori");
      // genuine translations survive (bare after localized admin-type stripping)
      expect(getStateName("JP", "JP-02", "ru")).toBe("Аомори");
      expect(getStateName("JP", "JP-26", "es-ES")).toBe("Kioto");
      expect(getStateName("JP", "JP-13", "es-ES")).toBe("Tokio");
    });

    it("strips localized admin-type words to bare names (es/fr/it/de/pt/ar)", () => {
      // "Prefectura de Aomori" -> "Aomori" (equal to base -> served via fallback)
      expect(getStateName("JP", "JP-02", "es-ES")).toBe("Aomori");
      expect(getStateName("JP", "JP-02", "fr")).toBe("Aomori");
      expect(getStateName("JP", "JP-02", "de")).toBe("Aomori");
      expect(getStateName("US", "US-NY", "fr")).toBe("New York"); // "État de New York"
      // collision guard: the province keeps its type word next to the city
      expect(getStateName("AR", "AR-B", "es-ES")).toBe("Provincia de Buenos Aires");
      expect(getStateName("AR", "AR-C", "es-ES")).toBe("Buenos Aires");
      // languages with natural type-suffix forms are untouched
      expect(getStateName("RU", "RU-MOS", "ru")).toBe("Московская область");
      expect(getStateName("CN", "CN-GD", "zh")).toBe("广东省");
    });
  });

  it("returns empty array for countries without state data", () => {
    const states = getStatesOfCountry("XX");
    expect(states).toEqual([]);
  });

  it("returns undefined for unknown codes", () => {
    expect(getCountry("XX")).toBeUndefined();
    expect(getCountryName("XX")).toBeUndefined();
    expect(getState("US", "ZZ")).toBeUndefined();
    expect(getStateName("US", "ZZ")).toBeUndefined();
  });

  it("getCountry and getState return full records and accept lowercase/bare codes", () => {
    expect(getCountry("us")).toEqual({ code: "US", name: "United States" });
    expect(getState("US", "CA")).toEqual({ code: "US-CA", countryCode: "US", name: "California" });
    expect(getState("us", "us-ca")).toEqual(getState("US", "US-CA"));
    expect(getStateName("US", "CA", "es-ES")).toBe(getStateName("US", "US-CA", "es-ES"));
  });

  it("getAllStates returns every subdivision with its countryCode", () => {
    const all = getAllStates();
    expect(all.length).toBeGreaterThan(4000);
    const ca = all.find((s) => s.code === "US-CA");
    expect(ca).toEqual({ code: "US-CA", countryCode: "US", name: "California" });
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
