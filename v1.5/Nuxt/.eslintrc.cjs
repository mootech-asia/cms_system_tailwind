module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  extends: ['standard'],
  globals: {
    defineNuxtPlugin: 'readonly',
    useCookie: 'readonly',
    useNuxtApp: 'readonly',
    useRuntimeConfig: 'readonly',
    navigateTo: 'readonly',
    createError: 'readonly',
    $fetch: 'readonly'
  },
  ignorePatterns: ['**/*.ts', '**/*.tsx', 'composables/useT.js']
}
