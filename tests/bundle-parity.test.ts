// The generator emits the data twice (ESM + CJS); the two must never drift.
import { createRequire } from "node:module";
import * as esm from "../data/bundle.js";

const require = createRequire(import.meta.url);

it("data/bundle.cjs exports exactly the same data as data/bundle.js", () => {
  const cjs = require("../data/bundle.cjs") as Record<string, unknown>;
  expect(Object.keys(cjs).sort()).toEqual(
    ["COUNTRIES", "COUNTRIES_LOCALIZED", "STATES", "STATES_LOCALIZED"].sort(),
  );
  expect(cjs.COUNTRIES).toEqual(esm.COUNTRIES);
  expect(cjs.COUNTRIES_LOCALIZED).toEqual(esm.COUNTRIES_LOCALIZED);
  expect(cjs.STATES).toEqual(esm.STATES);
  expect(cjs.STATES_LOCALIZED).toEqual(esm.STATES_LOCALIZED);
});
