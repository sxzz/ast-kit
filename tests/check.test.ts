import { describe, expect, test, vi } from 'vitest'
import {
  babelParse,
  isCallOf,
  isDeclarationType,
  isExpressionType,
  isFunctionType,
  isIdentifierOf,
  isInDestructureAssignment,
  isInNewExpression,
  isLiteralType,
  isReferenced,
  isReferencedIdentifier,
  isTaggedFunctionCallOf,
  isTypeOf,
  walkIdentifiers,
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

    expect(
      isTypeOf({ type: 'ArrayExpression' } as t.Expression, 'Expression'),
    ).toBe(true)
    expect(isTypeOf({ type: 'NullLiteral' }, 'Expression')).toBe(true)
    expect(isTypeOf({ type: 'JSXElement' } as t.Expression, 'Expression')).toBe(
      true,
    )
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
    expect(
      isFunctionType({ type: 'TSDeclareMethod' } as t.TSDeclareMethod),
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

  describe('isReferencedIdentifier', () => {
    test('identifier is referenced in a variable declaration', () => {
      expect.assertions(1)
      const ast = babelParse(`const a = b`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'b') {
          expect(isReferencedIdentifier(node, parent, parentStack)).toBe(true)
        }
      })
    })

    test('identifier is referenced in a function call', () => {
      expect.assertions(1)
      const ast = babelParse(`foo(bar)`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'bar') {
          expect(isReferencedIdentifier(node, parent, parentStack)).toBe(true)
        }
      })
    })

    test('identifier is referenced in a member expression', () => {
      expect.assertions(1)
      const ast = babelParse(`obj.prop`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'obj') {
          expect(isReferencedIdentifier(node, parent, parentStack)).toBe(true)
        }
      })
    })

    test('identifier is referenced in an assignment expression', () => {
      expect.assertions(1)
      const ast = babelParse(`a = b`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'b') {
          expect(isReferencedIdentifier(node, parent, parentStack)).toBe(true)
        }
      })
    })

    test('identifier is referenced in a return statement', () => {
      expect.assertions(1)
      const ast = babelParse(`function foo() { return bar }`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'bar') {
          expect(isReferencedIdentifier(node, parent, parentStack)).toBe(true)
        }
      })
    })

    test('identifier is referenced in a conditional expression', () => {
      expect.assertions(2)
      const ast = babelParse(`a ? b : c`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (
          node.type === 'Identifier' &&
          (node.name === 'b' || node.name === 'c')
        ) {
          expect(isReferencedIdentifier(node, parent, parentStack)).toBe(true)
        }
      })
    })

    test('identifiers in function parameters should not be inferred as references', () => {
      expect.assertions(4)
      const ast = babelParse(`(({ title }) => [])`)
      walkIdentifiers(
        ast.body[0],
        (node, parent, parentStack, isReference) => {
          expect(isReference).toBe(false)
          expect(isReferencedIdentifier(node, parent, parentStack)).toBe(false)
        },
        true,
      )
    })

    test('JSXNamespacedName should not be inferred as references', () => {
      const ast = babelParse(`const Comp = <svg:circle foo:bar="" />`, 'tsx')
      const onIdentifier = vi.fn()
      walkIdentifiers(ast.body[0], onIdentifier)
      expect(onIdentifier).toHaveBeenCalledTimes(0)
    })
  })

  describe('isInNewExpression', () => {
    test('identifier in NewExpression', () => {
      expect.assertions(1)
      const ast = babelParse(`new Foo()`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'Foo') {
          expect(isInNewExpression(parentStack)).toBe(true)
        }
      })
    })

    test('identifier not in NewExpression', () => {
      expect.assertions(1)
      const ast = babelParse(`Foo()`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'Foo') {
          expect(isInNewExpression(parentStack)).toBe(false)
        }
      })
    })

    test('identifier in nested MemberExpression within NewExpression', () => {
      expect.assertions(1)
      const ast = babelParse(`new Foo.Bar()`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'Foo') {
          expect(isInNewExpression(parentStack)).toBe(true)
        }
      })
    })

    test('identifier in deeply nested MemberExpression within NewExpression', () => {
      expect.assertions(1)
      const ast = babelParse(`new Foo.Bar.Baz()`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'Foo') {
          expect(isInNewExpression(parentStack)).toBe(true)
        }
      })
    })

    test('identifier in MemberExpression not in NewExpression', () => {
      expect.assertions(1)
      const ast = babelParse(`Foo.Bar()`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'Foo') {
          expect(isInNewExpression(parentStack)).toBe(false)
        }
      })
    })
  })

  describe('isInDestructureAssignment', () => {
    test('identifier in object destructure assignment', () => {
      expect.assertions(1)
      const ast = babelParse(`({ a: c } = obj)`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'c') {
          expect(isInDestructureAssignment(parent!, parentStack)).toBe(true)
        }
      })
    })

    test('identifier in array destructure assignment', () => {
      expect.assertions(1)
      const ast = babelParse(`[a, b] = arr`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'a') {
          expect(isInDestructureAssignment(parent!, parentStack)).toBe(true)
        }
      })
    })

    test('identifier in nested object destructure assignment', () => {
      expect.assertions(1)
      const ast = babelParse(`({ a: { b: c } } = obj)`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'c') {
          expect(isInDestructureAssignment(parent!, parentStack)).toBe(true)
        }
      })
    })

    test('identifier in nested array destructure assignment', () => {
      expect.assertions(1)
      const ast = babelParse(`[[a], b] = arr`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'a') {
          expect(isInDestructureAssignment(parent!, parentStack)).toBe(true)
        }
      })
    })

    test('identifier in mixed destructure assignment', () => {
      expect.assertions(1)
      const ast = babelParse(`({ a: [b, c] } = obj)`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'b') {
          expect(isInDestructureAssignment(parent!, parentStack)).toBe(true)
        }
      })
    })

    test('identifier in destructure assignment with default value', () => {
      expect.assertions(1)
      const ast = babelParse(`({ a = 1 } = obj)`, 'ts')
      walkIdentifiers(ast.body[0], (node, parent, parentStack) => {
        if (node.type === 'Identifier' && node.name === 'a') {
          expect(isInDestructureAssignment(parent!, parentStack)).toBe(false)
        }
      })
    })
  })
})
