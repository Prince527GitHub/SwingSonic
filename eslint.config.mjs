import globals from "globals";
import pluginJs from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Set up __dirname equivalent for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gitignorePath = path.resolve(__dirname, ".gitignore");

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Include .gitignore patterns in ESLint ignores
  includeIgnoreFile(gitignorePath),

  // JavaScript-specific configuration
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      quotes: [
        "warn",
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: false
        }
      ],
      "no-unneeded-ternary": ["warn", { defaultAssignment: false }]
    }
  },

  // Include recommended JS config
  {
    ...pluginJs.configs.recommended,
  },
];