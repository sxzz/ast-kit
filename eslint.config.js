import { sxzz, tseslint } from '@sxzz/eslint-config'

export default sxzz([
  {
    files: ['src/**.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
])
