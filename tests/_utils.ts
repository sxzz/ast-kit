import { babelParse, babelParseExpression } from '../src'
import type { ParseResult } from '@babel/parser'
import type * as t from '@babel/types'

export function parse(code: string, expression?: false): ParseResult<t.Program>
export function parse<T extends t.Node>(
  code: string,
  expression: true,
): ParseResult<T>
export function parse<T extends t.Node>(code: string, expression = false) {
  return (expression ? babelParseExpression<T> : babelParse)(code, undefined, {
    plugins: ['typescript', 'importAttributes'],
    errorRecovery: true,
  })
}
