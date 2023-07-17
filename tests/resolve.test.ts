import { describe, expect, test } from 'vitest'
import { type ParseResult } from '@babel/parser'
import {
  type ObjectPropertyLike,
  babelParse,
  babelParseExpression,
  resolveIdentifier,
  resolveObjectKey,
} from '../src'
import type * as t from '@babel/types'

function _parse(code: string, expression?: false): ParseResult<t.Program>
function _parse<T extends t.Node>(
  code: string,
  expression: true
): ParseResult<T>
function _parse<T extends t.Node>(code: string, expression = false) {
  return (expression ? babelParseExpression<T> : babelParse)(code, undefined, {
    plugins: ['typescript'],
    errorRecovery: true,
  })
}

describe('resolve', () => {
  test('resolveIdentifier', () => {
    {
      const parse = _parse<t.MemberExpression>
      expect(resolveIdentifier(parse('foo.bar.baz', true))).toEqual([
        'foo',
        'bar',
        'baz',
      ])
      expect(resolveIdentifier(parse('foo.bar["baz"]', true))).toEqual([
        'foo',
        'bar',
        'baz',
      ])
      expect(resolveIdentifier(parse('this.#a', true))).toEqual(['this', '#a'])
      expect(resolveIdentifier(parse('super.#a', true))).toEqual([
        'super',
        '#a',
      ])

      expect(() => resolveIdentifier(parse('foo.bar[b]', true))).toThrow(
        'Invalid Identifier'
      )
    }

    {
      const node = (
        _parse('type T = A.B.C').body[0] as t.TSTypeAliasDeclaration
      ).typeAnnotation as t.TSTypeReference
      expect(resolveIdentifier(node.typeName)).toEqual(['A', 'B', 'C'])
    }
  })

  test('resolveObjectKey', () => {
    const properties = _parse<t.ObjectExpression>(
      `{
      foo: 'foo',
      [1]: 'number',
      id: 'number',
    }`,
      true
    ).properties as ObjectPropertyLike[]
    expect(resolveObjectKey(properties[0])).toEqual('foo')
    expect(resolveObjectKey(properties[0], true)).toEqual('"foo"')

    expect(resolveObjectKey(properties[1])).toEqual(1)
    expect(resolveObjectKey(properties[1], true)).toEqual('1')

    expect(resolveObjectKey(properties[2])).toEqual('id')
    expect(resolveObjectKey(properties[2], true)).toEqual('"id"')

    expect(() => {
      resolveObjectKey(
        _parse<t.ObjectExpression>(`{ [id]: 'error' }`, true)
          .properties[0] as any
      )
    }).toThrow('Cannot resolve computed Identifier')
  })
})
