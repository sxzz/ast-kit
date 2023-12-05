import { describe, expect, test } from 'vitest'
import { isLiteralType, isTypeOf } from '../src'

describe('utils', () => {
  test('isTypeOf', () => {
    expect(isTypeOf({ type: 'NullLiteral' }, 'NullLiteral')).toBe(true)
    expect(
      isTypeOf({ type: 'NullLiteral' }, ['Literal', 'ObjectExpression']),
    ).toBe(true)
    expect(isTypeOf({ type: 'AnyTypeAnnotation' }, ['NullLiteral'])).toBe(false)
  })

  test('isLiteralType', () => {
    expect(isLiteralType({ type: 'NullLiteral' })).toBe(true)
    expect(isLiteralType({ type: 'AnyTypeAnnotation' })).toBe(false)
  })
})
