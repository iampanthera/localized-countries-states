import { normalize, levenshtein, ratio, displayIsoName } from "../../scripts/lib/text.mjs";

describe("normalize", () => {
  it("strips diacritics and lowercases", () => {
    expect(normalize("Plzeň")).toBe("plzen");
    expect(normalize("Comunidad Foral de Navarra")).toBe("comunidadforaldenavarra");
  });

  it("drops non-latin characters entirely", () => {
    expect(normalize("北海道")).toBe("");
    expect(normalize("Москва")).toBe("");
  });

  it("keeps digits", () => {
    expect(normalize("Region 12")).toBe("region12");
  });
});

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });
});

describe("ratio", () => {
  it("is 1 for identical or both-empty inputs", () => {
    expect(ratio("andalucia", "andalucia")).toBe(1);
    expect(ratio("", "")).toBe(1);
  });

  it("scales with similarity", () => {
    expect(ratio("catalonia", "catalonha")).toBeCloseTo(1 - 1 / 9);
    expect(ratio("abcd", "wxyz")).toBe(0);
  });
});

describe("displayIsoName", () => {
  it("un-inverts the ISO comma form", () => {
    expect(displayIsoName("Asturias, Principado de")).toBe("Principado de Asturias");
  });

  it("leaves plain names unchanged", () => {
    expect(displayIsoName("Andalucía")).toBe("Andalucía");
  });
});
