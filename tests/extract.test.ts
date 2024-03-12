import { describe, expect, test } from 'vitest'
import { babelParse, extractIdentifiers } from '../src'
import type * as t from '@babel/types'

describe('extract', () => {
  test('extractIdentifiers', () => {
    const ast = babelParse(`
      const one = 1
      const {
        propA,
        propB: aliasPropB,
        propC = 33,
        propD: aliasPropD = 44,
        ...objRest
      } = {
        propA: 1,
        propB: 2,
        propC: 3,
        propD: 4,
        propE: 5,
        propF: 6,
      }
      const [elOne, elTwo = 22, ...elRest] = [1, 2, 3, 4]    
      memberExpressionObj.a
    `)

    const identifiers: t.Identifier[] = []

    for (const b of ast.body) {
      if (b.type === 'VariableDeclaration') {
        for (const d of b.declarations) {
          extractIdentifiers(d.id, identifiers)
        }
      }

      if (b.type === 'ExpressionStatement') {
        extractIdentifiers(b.expression, identifiers)
      }
    }

    expect(
      identifiers.map((id) => ({
        name: id.name,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": "one",
        },
        {
          "name": "propA",
        },
        {
          "name": "aliasPropB",
        },
        {
          "name": "propC",
        },
        {
          "name": "aliasPropD",
        },
        {
          "name": "objRest",
        },
        {
          "name": "elOne",
        },
        {
          "name": "elTwo",
        },
        {
          "name": "elRest",
        },
        {
          "name": "memberExpressionObj",
        },
      ]
    `)
  })
})
