import { describe, expect, test } from 'vitest'
import {
  babelParse,
  babelParseExpression,
  getBabelParserOptions,
  parseCache,
} from '../src'

describe('parse', () => {
  test('babelParse', () => {
    babelParse('const a = 1')
    babelParse('const a: string = 1', 'ts')
    babelParse('const a: any = <div />', 'tsx')
    babelParse('const a: string', 'dts')

    expect(() => babelParse('class A { @a b }')).toThrow()
    babelParse('class A { @a b }', 'ts')

    babelParse(
      `import { type A } from '../../macros' assert { type: 'macro' }`,
      'ts',
      {
        plugins: ['deprecatedImportAssert'],
        cache: true,
      },
    )
    expect(Array.from(parseCache.keys())).lengthOf(1)
    expect(() => babelParse(`import { a } from 'b' assert {}`)).toThrow()

    babelParse(`using foo = useFoo()`, 'ts', {
      plugins: ['importAssertions'],
    })
  })

  test('babelParseExpression', () => {
    expect(babelParseExpression('1').type).toBe('NumericLiteral')
    expect(babelParseExpression('{}').type).toBe('ObjectExpression')
  })

  test('getBabelParserOptions', () => {
    expect(getBabelParserOptions('ts')).toEqual({
      plugins: expect.any(Array),
      sourceType: 'module',
    })

    expect(
      getBabelParserOptions(undefined, { allowAwaitOutsideFunction: true }),
    ).toEqual({
      plugins: ['jsx'],
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
  })
})
