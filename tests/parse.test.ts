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
    babelParse('const a: string = 1', 'ts', {
      plugins: ['typescript'],
    })
    babelParse('const a: any = <div />', 'tsx')
    babelParse('const a: string', 'dts')
    babelParse('export @foo class A {}', 'ts', {
      plugins: ['decorators'],
    })
    babelParse('<div />', 'jsx', {
      plugins: ['jsx'],
    })

    expect(() => babelParse('class A { @a b }')).toThrow()
    babelParse('class A { @a b }', 'ts')

    const code = `export {}`
    const program = babelParse(code, 'ts', { cache: true })
    const cached = babelParse(code, 'ts', { cache: true })
    expect(program.body).toBe(cached.body)
    expect(Array.from(parseCache.keys())).lengthOf(1)
    expect(() => babelParse(`import { a } from 'b' assert {}`)).toThrow()
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
