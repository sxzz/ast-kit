import { describe, expect, test } from 'vitest'
import { getLang, isDts, isTs } from '../src'

describe('lang', () => {
  test('getLang', () => {
    expect(getLang('foo.js')).toBe('js')
    expect(getLang('foo.ts')).toBe('ts')
    expect(getLang('foo.mts')).toBe('mts')
    expect(getLang('foo.cts')).toBe('cts')
    expect(getLang('foo.d.ts')).toBe('dts')
    expect(getLang('foo.d.mts')).toBe('dts')
    expect(getLang('foo.json')).toBe('json')
    expect(getLang('foo.vue')).toBe('vue')
  })

  test('isDts', () => {
    expect(isDts('foo.d.ts')).toBe(true)
    expect(isDts('foo.d.mts')).toBe(true)
    expect(isDts('foo.ts')).toBe(false)
    expect(isDts('foo.d.js')).toBe(false)
  })

  test('isTs', () => {
    expect(isTs('ts')).toBe(true)
    expect(isTs('cts')).toBe(true)
    expect(isTs('mts')).toBe(true)
    expect(isTs('tsx')).toBe(true)
    expect(isTs('dts')).toBe(true)
    expect(isTs('jsx')).toBe(false)
    expect(isTs('cjs')).toBe(false)
    expect(isTs()).toBe(false)
  })
})
