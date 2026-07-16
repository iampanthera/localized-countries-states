import {
  createLocalizedData,
  getAllCountries,
  getStatesOfCountry,
  getCountryName,
} from "../src/index.js";

describe("createLocalizedData", () => {
  it("exposes the normalized locale", () => {
    expect(createLocalizedData("ES-es").locale).toBe("es-ES");
    expect(createLocalizedData().locale).toBeUndefined();
  });

  it("produces the same results as the per-call API", () => {
    const data = createLocalizedData("es-ES");
    expect(data.getAllCountries()).toEqual(getAllCountries("es-ES"));
    expect(data.getStatesOfCountry("ES")).toEqual(getStatesOfCountry("ES", "es-ES"));
    expect(data.getCountryName("US")).toBe(getCountryName("US", "es-ES"));
  });

  it("supports lookups with bare and full state codes", () => {
    const data = createLocalizedData("es-ES");
    expect(data.getState("US", "NY")?.name).toBe("Nueva York");
    expect(data.getState("US", "US-NY")).toEqual(data.getState("US", "NY"));
    expect(data.getStateName("US", "ZZ")).toBeUndefined();
  });

  it("reports availability for its bound locale", () => {
    expect(createLocalizedData("es-ES").hasLocalizedCountries()).toBe(true);
    expect(createLocalizedData("es-ES").hasLocalizedStates("US")).toBe(true);
    expect(createLocalizedData().hasLocalizedCountries()).toBe(false);
  });

  it("an unlocalized instance returns English base names", () => {
    const data = createLocalizedData();
    expect(data.getCountryName("DE")).toBe("Germany");
    expect(data.getStateName("US", "CA")).toBe("California");
  });
});
