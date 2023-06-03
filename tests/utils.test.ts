import { describe, expect, test } from 'vitest'
import { isLiteralType } from '../src'

describe('utils', () => {
  test('isLiteralType', () => {
    expect(isLiteralType({ type: 'NullLiteral' })).toBe(true)
    expect(isLiteralType({ type: 'AnyTypeAnnotation' })).toBe(false)
  })
})
