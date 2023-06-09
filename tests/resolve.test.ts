import { describe, expect, test } from 'vitest'
import { type ParseResult } from '@babel/parser'
import {
  type ObjectPropertyLike,
  babelParseExpression,
  resolveIdentifier,
  resolveObjectKey,
} from '../src'
import type * as t from '@babel/types'

function _parse<T extends t.Node>(code: string) {
  return babelParseExpression(code, undefined, {
    errorRecovery: true,
  }) as unknown as ParseResult<T>
}

describe('resolve', () => {
  test('resolveIdentifier', () => {
    const parse = _parse<t.MemberExpression>
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

  test('resolveObjectKey', () => {
    const properties = _parse<t.ObjectExpression>(`{
      foo: 'foo',
      [1]: 'number',
      id: 'number',
    }`).properties as ObjectPropertyLike[]
    expect(resolveObjectKey(properties[0])).toEqual('foo')
    expect(resolveObjectKey(properties[0], true)).toEqual('"foo"')

    expect(resolveObjectKey(properties[1])).toEqual(1)
    expect(resolveObjectKey(properties[1], true)).toEqual('1')

    expect(resolveObjectKey(properties[2])).toEqual('id')
    expect(resolveObjectKey(properties[2], true)).toEqual('"id"')

    expect(() => {
      resolveObjectKey(
        _parse<t.ObjectExpression>(`{ [id]: 'error' }`).properties[0] as any
      )
    }).toThrow('Cannot resolve computed Identifier')
  })
})
