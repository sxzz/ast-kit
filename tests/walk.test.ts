import { describe, expect, test } from 'vitest'
import {
  babelParse,
  isTypeOf,
  walkBlockDeclarations,
  walkExportDeclaration,
  walkFunctionParams,
  walkIdentifiers,
  walkImportDeclaration,
  type ExportBinding,
  type ImportBinding,
} from '../src'
import type { BlockStatement, FunctionDeclaration } from '@babel/types'

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

  describe('walkIdentifiers', () => {
    test('JSXIdentifier', () => {
      const ast = babelParse(
        `
        function Comp({ Foo }){
        const a= 1
          return <Foo />
        }
        `,
        'tsx',
      )
      walkIdentifiers((ast.body[0] as FunctionDeclaration).body, (id) => {
        expect(id.name).toBe('Foo')
      })
    })

    test('JSXMemberExpression', () => {
      const ast = babelParse(
        `
        function Comp(props){
          return <props.Foo />
        }
        `,
        'tsx',
      )

      walkIdentifiers((ast.body[0] as FunctionDeclaration).body, (id) => {
        expect(id.name).toBe('props')
      })
    })

    test('nested identifiers', () => {
      const ast = babelParse(
        `
      function nested() {
        const a = 1;
        function inner() {
        const b = 2;
        return a + b;
        }
        return inner();
      }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkIdentifiers(
        (ast.body[0] as FunctionDeclaration).body,
        (id) => {
          identifiers.push(id.name)
        },
        true,
      )
      expect(identifiers).toEqual(['a', 'inner', 'b', 'a', 'b', 'inner'])
    })

    test('object pattern destructuring', () => {
      const ast = babelParse(
        `
      function destructure({ x, y }) {
        return x + y;
      }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkIdentifiers((ast.body[0] as FunctionDeclaration).body, (id) => {
        identifiers.push(id.name)
      })
      expect(identifiers).toEqual(['x', 'y'])
    })

    test('array pattern destructuring', () => {
      const ast = babelParse(
        `
      function destructure([a, b]) {
        return a + b;
      }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkIdentifiers((ast.body[0] as FunctionDeclaration).body, (id) => {
        identifiers.push(id.name)
      })
      expect(identifiers).toEqual(['a', 'b'])
    })

    test('catch clause identifiers', () => {
      const ast = babelParse(
        `
      try {
        throw new Error('test');
      } catch (error) {
        ;[error]
      }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkIdentifiers(
        (ast.body[0] as any).handler,
        (id) => {
          identifiers.push(id.name)
        },
        true,
      )
      expect(identifiers).toEqual(['error', 'error'])
    })

    test('for loop identifiers', () => {
      const ast = babelParse(
        `
      for (let i = 0; i < 10; i++) {
        ;[i]
      }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkIdentifiers(
        ast.body[0] as any,
        (id, _, __, isReference) => {
          if (isReference) identifiers.push(id.name)
        },
        true,
      )
      expect(identifiers).toEqual(['i', 'i', 'i'])
    })

    test('function parameters', () => {
      const ast = babelParse(
        `
      function params(a, b, c) {
        return a + b + c;
      }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkIdentifiers(
        ast.body[0] as FunctionDeclaration,
        (id) => {
          identifiers.push(id.name)
        },
        true,
      )
      expect(identifiers).toEqual(['params', 'a', 'b', 'c', 'a', 'b', 'c'])
    })

    test('ignore type annotations', () => {
      const ast = babelParse(
        `
      function typed(a: number, b: string): void {
        ;[a, b]
      }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkIdentifiers(
        ast.body[0] as FunctionDeclaration,
        (id) => {
          identifiers.push(id.name)
        },
        true,
      )
      expect(identifiers).toEqual(['typed', 'a', 'b', 'a', 'b'])
    })
  })

  test('walkFunctionParams', () => {
    const ast = babelParse(`function Comp({ foo }){}`, 'ts')
    walkFunctionParams(ast.body[0] as FunctionDeclaration, (id) => {
      expect(id.name).toBe('foo')
    })
  })

  describe('walkBlockDeclarations', () => {
    test('variable declarations', () => {
      const ast = babelParse(
        `
        {
          let a = 1;
          const b = 2;
          var c = 3;
        }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkBlockDeclarations(ast.body[0] as BlockStatement, (id) => {
        identifiers.push(id.name)
      })
      expect(identifiers).toEqual(['a', 'b', 'c'])
    })

    test('function and class declarations', () => {
      const ast = babelParse(
        `
        {
          function foo() {}
          class Bar {}
        }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkBlockDeclarations(ast.body[0] as BlockStatement, (id) => {
        identifiers.push(id.name)
      })
      expect(identifiers).toEqual(['foo', 'Bar'])
    })

    test('for loop variable declarations', () => {
      const ast = babelParse(
        `
        {
          for (let i = 0; i < 10; i++) {}
          for (const j of [1, 2, 3]) {}
          for (var k in { a: 1, b: 2 }) {}
        }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkBlockDeclarations(ast.body[0] as any, (id) => {
        identifiers.push(id.name)
      })
      expect(identifiers).toEqual(['k'])
    })

    test('nested block declarations', () => {
      const ast = babelParse(
        `
        {
          {
            let x = 1;
            const y = 2;
          }
          var z = 3;
        }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkBlockDeclarations(ast.body[0] as any, (id) => {
        identifiers.push(id.name)
      })
      expect(identifiers).toEqual(['z'])
    })

    test('ignore declared variables', () => {
      const ast = babelParse(
        `
        {
          declare const a: number;
          declare function foo(): void;
        }
      `,
        'ts',
      )
      const identifiers: string[] = []
      walkBlockDeclarations(ast.body[0] as any, (id) => {
        identifiers.push(id.name)
      })
      expect(identifiers).toEqual([])
    })
  })
})
