import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "locales/ar": "src/locales/ar.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "es2020",
  treeshake: true,
});
