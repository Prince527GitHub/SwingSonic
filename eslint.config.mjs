import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath, URL } from "node:url";
import globals from "globals";
import js from "@eslint/js";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

/** @type {import("eslint").Linter.Config[]} */
export default [
    includeIgnoreFile(gitignorePath),
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            globals: globals.node
        },
        rules: {
            quotes: ["warn", "double", { avoidEscape: true, allowTemplateLiterals: false }],
            "no-unneeded-ternary": ["warn", { defaultAssignment: false }],
            "no-empty": "off"
        }
    }
];
