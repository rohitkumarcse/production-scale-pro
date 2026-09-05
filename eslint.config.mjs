// Flat config (ESLint 9). Deliberately minimal — this exists to
// catch runtime-fatal mistakes that `node --check` cannot see,
// not to enforce a style.

export default [
  {
    files: ["**/*.js"],

    ignores: [
      "**/node_modules/**",
      "**/*.jmx",
    ],

    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",

      globals: {
        require: "readonly",
        module: "writable",
        exports: "writable",
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
        URL: "readonly",
        AbortController: "readonly",
      },
    },

    rules: {
      // The rule that would have caught MAX_REQUESTS being
      // swallowed into a comment.
      "no-undef": "error",

      // Catches the mirror-image mistake: something declared but
      // never reachable because a line got merged.
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      "no-unreachable": "error",
      "no-dupe-keys": "error",
      "no-const-assign": "error",
    },
  },
];
