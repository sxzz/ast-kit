import { describe, expect, test } from 'vitest'
import { escapeKey, isLiteralType, isTypeOf } from '../src'

describe('utils', () => {
  test('isTypeOf', () => {
    expect(isTypeOf({ type: 'NullLiteral' }, ['NullLiteral'])).toBe(true)
    expect(isTypeOf({ type: 'NullLiteral' }, ['Literal'])).toBe(true)
    expect(isTypeOf({ type: 'AnyTypeAnnotation' }, ['NullLiteral'])).toBe(false)
  })

  test('isLiteralType', () => {
    expect(isLiteralType({ type: 'NullLiteral' })).toBe(true)
    expect(isLiteralType({ type: 'AnyTypeAnnotation' })).toBe(false)
  })

  test('escapeKey', () => {
    expect(escapeKey('a')).toBe('a')
    expect(escapeKey('1')).toBe('1')
    expect(escapeKey('class')).toBe('class')
    expect(escapeKey('中文')).toBe('中文')

    expect(escapeKey('1_2')).toBe('"1_2"')
    expect(escapeKey('1e10')).toBe('"1e10"')
    expect(escapeKey('0xa')).toBe('"0xa"')
    expect(escapeKey('0b0')).toBe('"0b0"')
    expect(escapeKey('0o0')).toBe('"0o0"')
    expect(escapeKey('\t')).toBe('"\\t"')
    expect(escapeKey('1a')).toBe('"1a"')
  })
})
