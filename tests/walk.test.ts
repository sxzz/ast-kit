import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import {
  type ImportBinding,
  babelParse,
  walkASTSetup,
  walkImportDeclaration,
} from '../src'
import type * as t from '@babel/types'

describe('walk', () => {
  test('walkImportDeclaration', () => {
    const ast = babelParse(
      `
      import { a } from 'a' 
      import * as b from 'b'
      import c from 'c'
      import 'd'
      import e, { f } from 'e'
      import type { g } from 'g'
      import type h from 'h'
      import type * as i from 'i'
      import type j from 'j'
      import { type h } from 'h'`,
      'ts',
    )
    const imports: Record<string, ImportBinding> = {}
    for (const stmt of ast.body) {
      if (stmt.type === 'ImportDeclaration')
        walkImportDeclaration(imports, stmt)
    }

    expect(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.values(imports).map(({ specifier, ...i }) => i),
    ).toMatchInlineSnapshot(`
      [
        {
          "imported": "a",
          "isType": false,
          "local": "a",
          "source": "a",
        },
        {
          "imported": "*",
          "isType": false,
          "local": "b",
          "source": "b",
        },
        {
          "imported": "default",
          "isType": false,
          "local": "c",
          "source": "c",
        },
        {
          "imported": "default",
          "isType": false,
          "local": "e",
          "source": "e",
        },
        {
          "imported": "f",
          "isType": false,
          "local": "f",
          "source": "e",
        },
        {
          "imported": "h",
          "isType": true,
          "local": "h",
          "source": "h",
        },
      ]
    `)
  })

  test('walkASTSetup', async () => {
    const ast = babelParse(
      `
      function foo() {}
      function bar(id: string) {}
      const baz = 1
      `,
      'ts',
    )

    const walkFunctionDeclaration = vi.fn()
    const walkTS = vi.fn()
    const walkIdentifier = vi.fn()

    const p = walkASTSetup(ast, (setup) => {
      setup.onEnter('FunctionDeclaration', (node, parent) => {
        expectTypeOf<t.FunctionDeclaration>(node)
        expectTypeOf<t.ParentMaps['FunctionDeclaration']>(parent)
        walkFunctionDeclaration()
      })
      setup.onEnter(['NumericLiteral', 'TSStringKeyword'], (node, parent) => {
        expectTypeOf<t.NumericLiteral | t.TSStringKeyword>(node)
        expectTypeOf<t.ParentMaps['NumericLiteral' | 'TSStringKeyword']>(parent)
        walkTS()
      })
      setup.onEnter(
        (node): node is t.Identifier => node.type === 'Identifier',
        (node, parent) => {
          expectTypeOf<t.Identifier>(node)
          expectTypeOf<t.ParentMaps['Identifier']>(parent)
          walkIdentifier()
        },
      )

      setup.onEnter((node) => {
        expectTypeOf<t.Node>(node)
        return 123
      })
    })
    expect(walkFunctionDeclaration).toBeCalledTimes(0)

    await p
    expect(walkFunctionDeclaration).toBeCalledTimes(2)
    expect(walkTS).toBeCalledTimes(2)
    expect(walkIdentifier).toBeCalledTimes(4)
  })
})
