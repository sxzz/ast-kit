import type * as t from '@babel/types'

/**
 * Locates the trailing comma in the given code within the specified range.
 *
 * @param code - The code to search for the trailing comma.
 * @param start - The start index of the range to search within.
 * @param end - The end index of the range to search within.
 * @param comments - Optional array of comments to exclude from the search range.
 * @returns The index of the trailing comma, or -1 if not found.
 */
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
