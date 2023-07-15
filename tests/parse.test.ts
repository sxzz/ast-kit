import { describe, expect, test } from 'vitest'
import { babelParse, babelParseExpression } from '../src'

describe('parse', () => {
  test('babelParse', () => {
    babelParse('const a = 1')
    babelParse('const a: string = 1', 'ts')
    babelParse('const a: any = <div />', 'tsx')

    expect(() => babelParse('class A { @a b }')).toThrow()
    babelParse('class A { @a b }', 'ts')

    babelParse(
      `import { type A } from '../../macros' assert { type: 'macro' }`,
      'ts',
      {
        plugins: ['importAssertions'],
      }
    )
  })

  test('babelParseExpression', () => {
    expect(babelParseExpression('1').type).toBe('NumericLiteral')
    expect(babelParseExpression('{}').type).toBe('ObjectExpression')
  })
})
