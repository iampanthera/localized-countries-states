import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  // The data bundle stays a runtime dependency (never inlined into dist); Node and
  // bundlers pick data/bundle.js or data/bundle.cjs via the package "imports" map.
  external: ["#data"],
});
