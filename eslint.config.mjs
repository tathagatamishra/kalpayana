import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Images are arbitrary external URLs entered by the admin, so next/image
      // (which needs host allow-listing) is not usable here — plain <img> is intentional.
      "@next/next/no-img-element": "off",
      // We fetch-and-setState in effects for client-side search / pagination /
      // infinite scroll. The setState always happens after an await, so this is
      // an advisory, not a correctness issue here.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
