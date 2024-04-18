import { describe, expect, test } from 'vitest'
import { locateTrailingComma } from '../src'

describe('loc', () => {
  test('locateTrailingComma', () => {
    expect(locateTrailingComma('fn(a,)', 4, 6)).toBe(4)
    expect(locateTrailingComma('export { a , }', 10, 14)).toBe(11)

    expect(
      locateTrailingComma(`export { a, b/* @remove, *//*,*/, }`, 13, 35, [
        {
          type: 'CommentBlock',
          value: ' @remove, ',
          start: 13,
          end: 27,
        },
        {
          type: 'CommentBlock',
          value: ',',
          start: 27,
          end: 32,
        },
      ]),
    ).toBe(32)

    expect(
      locateTrailingComma(
        `export {
  a // a,
  ,
}`,
        12,
        24,
        [{ type: 'CommentLine', value: ' a,', start: 13, end: 18 }],
      ),
    ).toBe(21)

    expect(locateTrailingComma('a', 0, 1)).toBe(-1)
    expect(locateTrailingComma('fn(a)', 0, 5)).toBe(-1)
  })
})
