import { describe, expect, test } from 'vitest'
import {
  isCallOf,
  isExpressionType,
  isFunctionType,
  isIdentifierOf,
  isLiteralType,
  isReferenced,
  isTypeOf,
} from '../src'
import { parse as _parse } from './_utils'
import type * as t from '@babel/types'

describe('utils', () => {
  test('isTypeOf', () => {
    expect(isTypeOf(null, 'NullLiteral')).toBe(false)
    expect(isTypeOf({ type: 'NullLiteral' }, 'NullLiteral')).toBe(true)
    expect(
      isTypeOf({ type: 'NullLiteral' }, ['Literal', 'ObjectExpression']),
    ).toBe(true)
    expect(
      isTypeOf({ type: 'ClassMethod' } as t.ClassMethod, ['Function']),
    ).toBe(true)
    expect(isTypeOf({ type: 'AnyTypeAnnotation' }, ['NullLiteral'])).toBe(false)
    expect(isTypeOf({ type: 'NullLiteral' }, 'Expression')).toBe(true)
  })

  test('isLiteralType', () => {
    expect(isLiteralType({ type: 'NullLiteral' })).toBe(true)
    expect(isLiteralType({ type: 'AnyTypeAnnotation' })).toBe(false)
  })

  test('isFunctionType', () => {
    expect(
      isFunctionType({ type: 'FunctionDeclaration' } as t.FunctionDeclaration),
    ).toBe(true)
    expect(
      isFunctionType({ type: 'FunctionExpression' } as t.FunctionExpression),
    ).toBe(true)
  })

  test('isExpressionType', () => {
    expect(isExpressionType({ type: 'ArrayExpression' } as t.Expression)).toBe(
      true,
    )
    expect(isExpressionType({ type: 'BooleanLiteral' } as t.Expression)).toBe(
      true,
    )
    expect(isExpressionType({ type: 'Super' } as t.Expression)).toBe(true)

    expect(
      isExpressionType({
        type: 'FunctionDeclaration',
      } as t.FunctionDeclaration),
    ).toBe(false)
    expect(
      isExpressionType({ type: 'FunctionExpression' } as t.FunctionExpression),
    ).toBe(true)
  })

  test('isIdentifierOf', () => {
    expect(isIdentifierOf({ type: 'Identifier', name: 'foo' }, 'foo')).toBe(
      true,
    )
    expect(
      isIdentifierOf({ type: 'Identifier', name: 'bar' }, ['foo', 'bar']),
    ).toBe(true)
  })

  test('isCallOf', () => {
    expect(isCallOf(null, 'foo')).toBe(false)
    expect(isCallOf({ type: 'ThisExpression' }, 'foo')).toBe(false)
    expect(
      isCallOf(
        {
          type: 'CallExpression',
          callee: { type: 'ThisExpression' },
          arguments: [],
        },
        'foo',
      ),
    ).toBe(false)
    expect(
      isCallOf(
        {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'foo' },
          arguments: [],
        },
        'foo',
      ),
    ).toBe(true)
    expect(
      isCallOf(
        {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'bar' },
          arguments: [],
        },
        ['foo', 'bar'],
      ),
    ).toBe(true)
    expect(
      isCallOf(
        {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'bar' },
          arguments: [],
        },
        (n) => n.startsWith('b'),
      ),
    ).toBe(true)
  })

  describe('isReferenced', () => {
    test('member', () => {
      const node = _parse<t.MemberExpression>('foo.bar', true)
      expect(isReferenced(node.object, node)).toBe(true)
      expect(isReferenced(node.property, node)).toBe(false)

      const node2 = _parse<t.MemberExpression>('foo[bar]', true)
      expect(isReferenced(node2.property, node2)).toBe(true)
    })

    test('class', () => {
      const node = _parse('class Foo {}').body[0] as t.ClassDeclaration
      expect(isReferenced(node.id!, node)).toBe(false)

      const node2 = _parse<t.ClassExpression>('class extends Foo {}', true)
      expect(isReferenced(node2.superClass!, node2)) //.toBe(true)
    })
  })
})
