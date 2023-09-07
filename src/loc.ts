import type * as t from '@babel/types'

export function locateTrailingComma(
  code: string,
  start: number,
  end: number,
  comments: t.Comment[] = []
) {
  let i = start
  while (i < end) {
    if (comments.some((c) => i >= c.start! && i < c.end!)) {
      i++
      continue
    }

    if (code[i] === ',') return i
    i++
  }
  return -1
}
