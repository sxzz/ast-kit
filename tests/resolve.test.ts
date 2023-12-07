import { describe, expect, test } from 'vitest'
import {
  type ObjectPropertyLike,
  resolveIdentifier,
  resolveLiteral,
  resolveObjectKey,
  resolveString,
} from '../src'
import { parse as _parse } from './_utils'
import type * as t from '@babel/types'

describe('resolve', () => {
  test('resolveString', () => {
    expect(resolveString('foo')).toBe('foo')
  })

  test('resolveLiteral', () => {
    const parse = _parse<t.Literal>
    expect(resolveLiteral(parse("`hello${'world'}`", true))).toBe('helloworld')
    expect(resolveLiteral(parse('1', true))).toBe(1)
    expect(resolveLiteral(parse('false', true))).toBe(false)
    expect(resolveLiteral(parse('null', true))).toBe(null)
    expect(resolveLiteral(parse('8n', true))).toBe(8n)
    expect(resolveLiteral(parse('/foo/g', true))).toEqual(/foo/g)

    expect(() => resolveLiteral(parse('`hello${id}`', true))).toThrowError(
      'TemplateLiteral expression must be a literal',
    )
  })

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
        'Invalid Identifier',
      )
      expect(() => resolveIdentifier(parse('foo.bar[fn()]', true))).toThrow(
        'Invalid Identifier',
      )
      expect(() => resolveIdentifier(parse('fn()[0]', true))).toThrow(
        'Invalid Identifier',
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
      ['id']: 'number',
    }`,
      true,
    ).properties as ObjectPropertyLike[]
    expect(resolveObjectKey(properties[0])).toEqual('foo')
    expect(resolveObjectKey(properties[0], true)).toEqual('"foo"')

    expect(resolveObjectKey(properties[1])).toEqual(1)
    expect(resolveObjectKey(properties[1], true)).toEqual('1')

    expect(resolveObjectKey(properties[2])).toEqual('id')
    expect(resolveObjectKey(properties[2], true)).toEqual("'id'")

    expect(() =>
      resolveObjectKey({ key: { type: 'Unknown' } } as any),
    ).toThrowError('Unexpected node type: Unknown')

    const ast = _parse("import {} from '' with { type: 'json' }", false)
    expect(
      resolveObjectKey((ast.body[0] as t.ImportDeclaration).attributes![0]),
    ).toEqual('type')

    expect(() => {
      resolveObjectKey(
        _parse<t.ObjectExpression>(`{ [id]: 'error' }`, true)
          .properties[0] as any,
      )
    }).toThrow('Cannot resolve computed Identifier')
  })
})
