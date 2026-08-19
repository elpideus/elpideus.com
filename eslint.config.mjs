import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Flat config. `eslint-config-next` ships flat config arrays directly, so no
 * compatibility layer is needed and none should be added back.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**", "docs/**", "prototype/**", "public/**"],
  },
  {
    // The canvas layer mutates three.js objects (uniforms, vectors, materials)
    // inside the render loop. Those objects are owned by three.js, not by
    // React, and reallocating them every frame is exactly what the pattern
    // exists to avoid, so the immutability rule does not apply here.
    files: ["src/components/canvas/**/*.tsx", "src/components/mobile/sky/**/*.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
];

export default config;
