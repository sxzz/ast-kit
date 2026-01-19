import { babelParse, babelParseExpression } from '../src'
import type { ParseError } from '@babel/parser'
import type * as t from '@babel/types'

export function parse(
  code: string,
  expression?: false,
): t.Program & { errors: null | ParseError[] }
export function parse<T extends t.Node>(
  code: string,
  expression: true,
): T & { errors: null | ParseError[] }
export function parse<T extends t.Node>(code: string, expression = false) {
  return (expression ? babelParseExpression<T> : babelParse)(code, undefined, {
    plugins: ['typescript'],
    errorRecovery: true,
  })
}
