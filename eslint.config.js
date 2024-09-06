import { sxzz } from '@sxzz/eslint-config'

export default sxzz([
  {
    files: ['src/**.ts'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
])
