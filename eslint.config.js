import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "package.legacy.json",
      // Legacy pre-modernization dirs (removed in Task 27)
      "src/**",
      "site/**",
      "controls/**",
      "app.js",
      // Generated build artifacts
      "client/vite.config.js",
      "client/vite.config.d.ts",
      "**/*.tsbuildinfo",
      // Tool-specific scratch dirs
      ".remember/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["client/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
);
