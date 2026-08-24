// https://eslint.nuxt.com
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintConfigPrettier from 'eslint-config-prettier'

export default withNuxt(
    // Project-specific overrides go here.
    {
        rules: {
            // Enforce type-safety guardrails from AGENTS.md / docs/STACK.md.
            '@typescript-eslint/no-explicit-any': 'error',
            'vue/multi-word-component-names': 'off',
        },
    },
    // Keep ESLint and Prettier from fighting over formatting.
    eslintConfigPrettier,
)
