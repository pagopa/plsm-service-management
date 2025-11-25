import { defineConfig } from "tsup";

export default defineConfig({
  banner: {
    js: `"use client"`,
  },
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: ["react", "react-dom"],
  treeshake: false,
  splitting: true,
  sourcemap: true,
});
