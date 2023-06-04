import { describe, expect, test } from 'vitest'
import { type ImportBinding, babelParse, walkImportDeclaration } from '../src'

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
      'ts'
    )
    const imports: Record<string, ImportBinding> = {}
    for (const stmt of ast.body) {
      if (stmt.type === 'ImportDeclaration')
        walkImportDeclaration(imports, stmt)
    }

    expect(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.values(imports).map(({ specifier, ...i }) => i)
    ).toMatchInlineSnapshot(`
      [
        {
          "imported": "a",
          "local": "a",
          "source": "a",
        },
        {
          "imported": "*",
          "local": "b",
          "source": "b",
        },
        {
          "imported": "default",
          "local": "c",
          "source": "c",
        },
        {
          "imported": "default",
          "local": "e",
          "source": "e",
        },
        {
          "imported": "f",
          "local": "f",
          "source": "e",
        },
      ]
    `)
  })
})
