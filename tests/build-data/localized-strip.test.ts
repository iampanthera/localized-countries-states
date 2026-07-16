import {
  localizedStripDecision,
  stripLocalizedAdminTypes,
} from "../../scripts/lib/localized-strip.mjs";

function emptyReport() {
  return {
    localizedSuffixesStripped: { total: 0, byLang: {} as Record<string, number> },
    localizedStrippedToBase: 0,
    localizedStripSkipped: [] as {
      country: string;
      lang: string;
      code: string;
      name: string;
      reason: string;
    }[],
  };
}

describe("localizedStripDecision", () => {
  it("strips Romance admin-type prefixes with their connective", () => {
    expect(localizedStripDecision("es", "Prefectura de Aomori")).toEqual({ stripped: "Aomori" });
    expect(localizedStripDecision("es", "Provincia del Chaco")).toEqual({ stripped: "Chaco" });
    expect(localizedStripDecision("fr", "Préfecture d'Aomori")).toEqual({ stripped: "Aomori" });
    expect(localizedStripDecision("fr", "État de New York")).toEqual({ stripped: "New York" });
    expect(localizedStripDecision("it", "Provincia di Milano")).toEqual({ stripped: "Milano" });
    expect(localizedStripDecision("it", "Governatorato dell'Asyut")).toEqual({
      stripped: "Asyut",
    });
  });

  it("strips German and Arabic type words attached without a connective", () => {
    expect(localizedStripDecision("de", "Provinz Limburg")).toEqual({ stripped: "Limburg" });
    expect(localizedStripDecision("de", "Präfektur Aomori")).toEqual({ stripped: "Aomori" });
    expect(localizedStripDecision("ar", "محافظة القاهرة")).toEqual({ stripped: "القاهرة" });
    expect(localizedStripDecision("ar", "أومسك أوبلاست")).toEqual({ stripped: "أومسك" });
  });

  it("does not touch names that merely start with a type word (no connective)", () => {
    expect(localizedStripDecision("es", "Región Metropolitana de Santiago")).toBeNull();
    expect(localizedStripDecision("es", "Comunidad Foral de Navarra")).toBeNull();
  });

  it("does not touch languages without patterns (ru natural suffix forms)", () => {
    expect(localizedStripDecision("ru", "Московская область")).toBeNull();
    expect(localizedStripDecision("zh", "广东省")).toBeNull();
  });

  it("keeps purely directional/generic remainders", () => {
    expect(localizedStripDecision("fr", "Province du Nord")).toEqual({
      skip: "generic-remainder",
    });
    expect(localizedStripDecision("it", "Regione del Centro-Est")).toEqual({
      skip: "generic-remainder",
    });
    expect(localizedStripDecision("es", "Región Central")).toBeNull(); // no connective, not a candidate
  });

  it("keeps remainders that do not look like a proper name", () => {
    expect(localizedStripDecision("es", "Provincia de las tierras")).toEqual({
      skip: "lowercase-remainder",
    });
  });
});

describe("stripLocalizedAdminTypes", () => {
  it("strips within a layer and drops entries that become identical to the base", () => {
    const base = { "JP-02": "Aomori", "JP-26": "Kyoto" };
    const localized = {
      es: { "JP-02": "Prefectura de Aomori", "JP-26": "Prefectura de Kioto" },
    };
    const report = emptyReport();
    stripLocalizedAdminTypes("JP", base, localized, {}, report);
    expect(localized.es).toEqual({ "JP-26": "Kioto" }); // JP-02 now equals base -> dropped
    expect(report.localizedStrippedToBase).toBe(1);
    expect(report.localizedSuffixesStripped.byLang.es).toBe(1);
  });

  it("keeps the type word when stripping would collide with a sibling", () => {
    const base = { "AR-B": "Buenos Aires Province", "AR-C": "Buenos Aires" };
    const localized = { es: { "AR-B": "Provincia de Buenos Aires" } };
    const report = emptyReport();
    stripLocalizedAdminTypes("AR", base, localized, {}, report);
    expect(localized.es["AR-B"]).toBe("Provincia de Buenos Aires");
    expect(report.localizedStripSkipped).toEqual([
      {
        country: "AR",
        lang: "es",
        code: "AR-B",
        name: "Provincia de Buenos Aires",
        reason: "collision",
      },
    ]);
  });

  it("reverts both siblings that would strip to the same name", () => {
    const base = { "XX-1": "Foo Province", "XX-2": "Foo District" };
    const localized = { es: { "XX-1": "Provincia de Foo", "XX-2": "Distrito de Foo" } };
    const report = emptyReport();
    stripLocalizedAdminTypes("XX", base, localized, {}, report);
    expect(localized.es["XX-1"]).toBe("Provincia de Foo");
    expect(localized.es["XX-2"]).toBe("Distrito de Foo");
  });

  it("never strips curated localized overrides", () => {
    const base = { "XX-1": "Foo" };
    const localized = { es: { "XX-1": "Provincia de Bar" } };
    const overrides = { es: { "XX-1": "Provincia de Bar" } };
    const report = emptyReport();
    stripLocalizedAdminTypes("XX", base, localized, overrides, report);
    expect(localized.es["XX-1"]).toBe("Provincia de Bar");
    expect(report.localizedStripSkipped[0].reason).toBe("override");
  });
});
