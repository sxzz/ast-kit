import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import {
  type ExportBinding,
  type ImportBinding,
  babelParse,
  isTypeOf,
  walkASTSetup,
  walkExportDeclaration,
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

    expect(Object.values(imports).map(({ specifier, ...i }) => i))
      .toMatchInlineSnapshot(`
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

  describe('walkExportDeclaration', () => {
    function getExports(code: string) {
      const ast = babelParse(code, 'ts', { plugins: ['exportDefaultFrom'] })

      const exports: Record<string, ExportBinding> = {}

      for (const n of ast.body) {
        if (
          !!n &&
          isTypeOf(n, [
            'ExportDefaultDeclaration',
            'ExportAllDeclaration',
            'ExportNamedDeclaration',
          ])
        ) {
          walkExportDeclaration(exports, n)
        }
      }

      return exports
    }

    function mapExports(exports: Record<string, ExportBinding>) {
      return Object.values(exports).map(
        ({ declaration, specifier, ...rest }) => rest,
      )
    }

    test.each([
      { code: 'export default function() {}', desc: 'function' },
      { code: 'export default function foo() {}', desc: 'function with id' },
      { code: 'export default class {}', desc: 'class' },
      { code: 'export default class Cls {}', desc: 'class with id' },
      { code: 'export default function tsFoo(): void', desc: 'ts declaration' },
      {
        code: `
          const one = 1
          export default one
        `,
        desc: 'expression with VariableDeclaration',
      },
      { code: 'export default [1]', desc: 'expression' },
    ])('ExportDefaultDeclaration $desc', ({ code }) => {
      const exports = getExports(code)

      expect(mapExports(exports)).matchSnapshot()
    })

    test.each([
      { code: `export * from "a"`, desc: 'value' },
      { code: `export type * from "a"`, desc: 'type' },
    ])('ExportAllDeclaration $desc', ({ code }) => {
      const exports = getExports(code)
      expect(mapExports(exports)).toMatchSnapshot()
    })

    test('ExportNamedDeclaration', () => {
      const exports = getExports(`
        const one = 1
        const two = 2
        export class clz {}
        export { one, one as aliasOne, type one as specifierTypeOne }
        export d from 'z'
        export type { one as nodeTypeOne }
        export type { two }
  
        export { a, b as aliasB } from "z"
        export * as zAll from "z"
  
        export type { c, d as aliasTypeD } from "z"
        export type * as zTypeAll from "z"
      `)

      expect(mapExports(exports)).toMatchSnapshot()
    })

    /**
     * @see https://tc39.es/ecma262/multipage/ecmascript-language-scripts-and-modules.html#table-export-forms-mapping-to-exportentry-records
     */
    test.each([
      { code: 'export var v', desc: '1' },
      { code: 'export default function f() {}', desc: '2' },
      { code: 'export default function () {}', desc: '3' },
      { code: 'export default 42', desc: '4' },
      { code: `const x = "5";export {x}`, desc: '5' },
      { code: `const v = "v";export {v as x}`, desc: '6' },
      { code: `export {x} from "mod"`, desc: '7' },
      { code: `export {v as x} from "mod"`, desc: '8' },
      { code: `export * from "mod"`, desc: '9' },
      { code: `export * as ns from "mod"`, desc: '10' },
    ])('ExportEntry record fields $desc', ({ code }) => {
      const exports = getExports(code)

      expect(mapExports(exports)).toMatchSnapshot()
    })
  })
})
