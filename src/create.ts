import type * as t from '@babel/types'

/**
 * Creates a string literal AST node.
 *
 * @param value - The value of the string literal.
 * @returns The string literal AST node.
 */
export function createStringLiteral(value: string): t.StringLiteral {
  return {
    type: 'StringLiteral',
    value,
    extra: {
      rawValue: value,
      raw: JSON.stringify(value),
    },
  }
}

/**
 * Creates a TypeScript union type AST node.
 *
 * @param types - An array of TypeScript types.
 * @returns The TypeScript union type AST node.
 */
export function createTSUnionType(types: t.TSType[]): t.TSUnionType {
  return {
    type: 'TSUnionType',
    types,
  }
}

/**
 * Creates a TypeScript literal type AST node.
 *
 * @param literal - The literal value.
 * @returns The TypeScript literal type AST node.
 */
export function createTSLiteralType(
  literal: t.TSLiteralType['literal'],
): t.TSLiteralType {
  return {
    type: 'TSLiteralType',
    literal,
  }
}
