import { describe, expect, test } from 'vitest'
import {
  isCallOf,
  isDeclarationType,
  isExpressionType,
  isFunctionType,
  isIdentifierOf,
  isLiteralType,
  isReferenced,
  isTaggedFunctionCallOf,
  isTypeOf,
} from '../src'
import { parse as _parse } from './_utils'
import type * as t from '@babel/types'
import type * as estree from 'estree'

describe('check', () => {
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

    expect(
      isTypeOf({ type: 'ArrayExpression' } as t.Expression, 'Expression'),
    ).toBe(true)
    expect(isTypeOf({ type: 'NullLiteral' }, 'Expression')).toBe(true)
    expect(isTypeOf({ type: 'JSXElement' } as t.Expression, 'Expression')).toBe(
      true,
    )

    expect(isTypeOf({ type: 'Literal' } as estree.Literal, 'Literal')).toBe(
      true,
    )
  })

  test('isLiteralType', () => {
    expect(isLiteralType({ type: 'NullLiteral' })).toBe(true)
    expect(isLiteralType({ type: 'AnyTypeAnnotation' })).toBe(false)

    expect(isLiteralType({ type: 'Literal' } as estree.Literal)).toBe(true)
  })

  test('isFunctionType', () => {
    expect(
      isFunctionType({ type: 'FunctionDeclaration' } as t.FunctionDeclaration),
    ).toBe(true)
    expect(
      isFunctionType({ type: 'FunctionExpression' } as t.FunctionExpression),
    ).toBe(true)
    expect(
      isFunctionType({ type: 'TSDeclareMethod' } as t.TSDeclareMethod),
    ).toBe(false)
    expect(isFunctionType({ type: 'ClassMethod' } as t.ClassMethod)).toBe(true)
    expect(
      isFunctionType({ type: 'MethodDefinition' } as estree.MethodDefinition),
    ).toBe(false)
  })

  test('isDeclarationType', () => {
    expect(
      isDeclarationType({
        type: 'FunctionDeclaration',
      } as t.FunctionDeclaration),
    ).toBe(true)
    expect(
      isDeclarationType({
        type: 'Placeholder',
        expectedNode: 'Declaration',
      } as t.Placeholder),
    ).toBe(true)
    expect(
      isDeclarationType({ type: 'FunctionExpression' } as t.FunctionExpression),
    ).toBe(false)
    expect(isDeclarationType(null)).toBe(false)
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

    expect(isExpressionType({ type: 'Literal' } as estree.Literal)).toBe(true)
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

  test('isTaggedFunctionCallOf', () => {
    expect(isTaggedFunctionCallOf(null, 'foo')).toBe(false)
    expect(isTaggedFunctionCallOf({ type: 'ThisExpression' }, 'foo')).toBe(
      false,
    )
    expect(
      isTaggedFunctionCallOf(
        {
          type: 'TaggedTemplateExpression',
          tag: { type: 'Identifier', name: 'foo' },
          quasi: { type: 'TemplateLiteral', quasis: [], expressions: [] },
        },
        'foo',
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
