import { isValidLocalizedName } from "../../scripts/lib/validate.mjs";

describe("isValidLocalizedName", () => {
  it("rejects empty values", () => {
    expect(isValidLocalizedName("fr", "")).toBe(false);
    expect(isValidLocalizedName("fr", undefined)).toBe(false);
  });

  it("rejects Cyrillic contamination outside the ru layer", () => {
    expect(isValidLocalizedName("zh", "китайский")).toBe(false);
    expect(isValidLocalizedName("de", "Москва")).toBe(false);
  });

  it("accepts Cyrillic in the ru layer", () => {
    expect(isValidLocalizedName("ru", "Москва")).toBe(true);
  });

  it("rejects leaked language names regardless of case/whitespace", () => {
    expect(isValidLocalizedName("zh", "Chinese")).toBe(false);
    expect(isValidLocalizedName("en", " english ")).toBe(false);
  });

  it("accepts ordinary localized names", () => {
    expect(isValidLocalizedName("fr", "Bavière")).toBe(true);
    expect(isValidLocalizedName("zh", "巴伐利亚")).toBe(true);
  });
});
