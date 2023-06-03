import { describe, expect, test } from 'vitest'
import { babelParse, resolveIdentifier } from '../src'
import type {
  ExpressionStatement,
  MemberExpression,
  Program,
} from '@babel/types'

function getExpression(program: Program, index: number) {
  return (program.body[index] as ExpressionStatement).expression
}

describe('resolve', () => {
  test('resolveIdentifier', () => {
    const program = babelParse(`
    foo.bar.baz
    foo.bar["baz"]
    foo.bar[b]
    `)
    // @ts-expect-error
    expect(() => resolveIdentifier(program)).toThrow()

    expect(() =>
      // @ts-expect-error
      resolveIdentifier(program.body[0])
    ).toThrow('Invalid Identifier')

    expect(
      resolveIdentifier(getExpression(program, 0) as MemberExpression)
    ).toEqual(['foo', 'bar', 'baz'])

    expect(
      resolveIdentifier(getExpression(program, 1) as MemberExpression)
    ).toEqual(['foo', 'bar', 'baz'])

    expect(() =>
      resolveIdentifier(getExpression(program, 2) as MemberExpression)
    ).toThrow('Invalid Identifier')
  })
})
