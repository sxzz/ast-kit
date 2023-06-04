import { describe, expect, test } from 'vitest'
import {
  type ExpressionStatement,
  type MemberExpression,
  type Program,
} from '@babel/types'
import { babelParse, resolveIdentifier } from '../src'

function getExpression(program: Program, index: number) {
  return (program.body[index] as ExpressionStatement).expression
}

describe('resolve', () => {
  test('resolveIdentifier', () => {
    const program = babelParse(
      `
    foo.bar.baz
    foo.bar["baz"]
    foo.bar[b];
    this.#a
    super.#a
    `,
      undefined,
      { errorRecovery: true }
    )
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

    expect(
      resolveIdentifier(getExpression(program, 3) as MemberExpression)
    ).toEqual(['this', '#a'])

    expect(
      resolveIdentifier(getExpression(program, 4) as MemberExpression)
    ).toEqual(['super', '#a'])
  })
})
