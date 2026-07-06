import { Country, State, setLocale } from "../src/compat";

describe("compat: country-state-city drop-in", () => {
  beforeEach(() => setLocale(undefined)); // reset to English default

  describe("Country", () => {
    it("getAllCountries returns { isoCode, name } for all countries", () => {
      const all = Country.getAllCountries();
      expect(all.length).toBeGreaterThan(190);
      const us = all.find((c) => c.isoCode === "US");
      expect(us).toEqual({ isoCode: "US", name: "United States" });
    });

    it("getCountryByCode returns a country or undefined (case-insensitive)", () => {
      expect(Country.getCountryByCode("es")).toEqual({ isoCode: "ES", name: "Spain" });
      expect(Country.getCountryByCode("ZZ")).toBeUndefined();
    });

    it("localizes via per-call locale and setLocale default", () => {
      expect(Country.getCountryByCode("FR", "es-ES")!.name).toBe("Francia");
      setLocale("de-DE");
      expect(Country.getCountryByCode("FR")!.name).toBe("Frankreich");
    });
  });

  describe("State", () => {
    it("getStatesOfCountry returns BARE isoCodes (CA, not US-CA) with countryCode", () => {
      const states = State.getStatesOfCountry("US");
      expect(states.length).toBeGreaterThan(50);
      const ca = states.find((s) => s.isoCode === "CA");
      expect(ca).toEqual({ isoCode: "CA", name: "California", countryCode: "US" });
      // no full-ISO prefixes leaked through
      expect(states.every((s) => !s.isoCode.startsWith("US-"))).toBe(true);
    });

    it("getStateByCodeAndCountry accepts a bare code and country", () => {
      expect(State.getStateByCodeAndCountry("CA", "US")).toEqual({
        isoCode: "CA",
        name: "California",
        countryCode: "US",
      });
      expect(State.getStateByCodeAndCountry("ZZ", "US")).toBeUndefined();
    });

    it("getAllStates returns every subdivision with a countryCode", () => {
      const all = State.getAllStates();
      expect(all.length).toBeGreaterThan(4000);
      expect(all.every((s) => typeof s.countryCode === "string" && s.countryCode.length === 2)).toBe(true);
    });

    it("localizes state names, falling back to the base name", () => {
      const es = State.getStatesOfCountry("ES", "es-ES");
      expect(es.find((s) => s.isoCode === "CT")!.name).toBe("Cataluña");
      // Alicante (province) has no esosedi translation -> base name
      expect(es.find((s) => s.isoCode === "A")!.name).toBe("Alicante");
    });

    it("returns [] for an unknown country", () => {
      expect(State.getStatesOfCountry("ZZ")).toEqual([]);
    });
  });
});
