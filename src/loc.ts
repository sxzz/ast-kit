import type * as t from '@babel/types'

export function locateTrailingComma(
  code: string,
  start: number,
  end: number,
  comments: t.Comment[] = [],
): number {
  let i = start
  while (i < end) {
    if (comments.some((c) => i >= c.start! && i < c.end!)) {
      i++
      continue
    }

    const char = code[i]
    if (['}', ')'].includes(char)) return -1
    if (char === ',') return i
    i++
  }
  return -1
}
