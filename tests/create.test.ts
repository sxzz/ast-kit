import { describe, expect, test } from 'vitest'
import * as t from '@babel/types'
import {
  createStringLiteral,
  createTSLiteralType,
  createTSUnionType,
} from '../src'

describe('create', () => {
  test('createStringLiteral', () => {
    expect(createStringLiteral('hello')).toEqual(
      expect.objectContaining(t.stringLiteral('hello')),
    )
  })

  test('createTSUnionType', () => {
    const union = [t.tsStringKeyword(), t.tsNumberKeyword()]
    expect(createTSUnionType(union)).toEqual(t.tsUnionType(union))
  })

  test('createTSUnionType', () => {
    const literal = t.booleanLiteral(true)
    expect(createTSLiteralType(literal)).toEqual(t.tsLiteralType(literal))
  })
})
