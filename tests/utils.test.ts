import { describe, expect, test } from 'vitest'
import { escapeKey, unwrapTSNode } from '../src'
import { parse as _parse } from './_utils'
import type * as t from '@babel/types'

describe('utils', () => {
  test('unwrapTSNode', () => {
    const parse = _parse<t.TSAsExpression>
    const node = parse('a as string', true)
    expect(unwrapTSNode(node)).toEqual(node.expression)
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
    expect(escapeKey('\t')).toBe(String.raw`"\t"`)
    expect(escapeKey('1a')).toBe('"1a"')
  })
})
