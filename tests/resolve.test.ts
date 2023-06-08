import { describe, expect, test } from 'vitest'
import { type MemberExpression } from '@babel/types'
import { babelParseExpression, resolveIdentifier } from '../src'

function parse(code: string) {
  return babelParseExpression(code, undefined, {
    errorRecovery: true,
  }) as MemberExpression
}

describe('resolve', () => {
  test('resolveIdentifier', () => {
    expect(resolveIdentifier(parse('foo.bar.baz'))).toEqual([
      'foo',
      'bar',
      'baz',
    ])
    expect(resolveIdentifier(parse('foo.bar["baz"]'))).toEqual([
      'foo',
      'bar',
      'baz',
    ])
    expect(resolveIdentifier(parse('this.#a'))).toEqual(['this', '#a'])
    expect(resolveIdentifier(parse('super.#a'))).toEqual(['super', '#a'])

    expect(() => resolveIdentifier(parse('foo.bar[b]'))).toThrow(
      'Invalid Identifier'
    )
  })
})
