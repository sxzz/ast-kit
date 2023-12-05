import type * as t from '@babel/types'

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

export function createTSUnionType(types: t.TSType[]): t.TSUnionType {
  return {
    type: 'TSUnionType',
    types,
  }
}

export function createTSLiteralType(
  literal: t.TSLiteralType['literal'],
): t.TSLiteralType {
  return {
    type: 'TSLiteralType',
    literal,
  }
}
