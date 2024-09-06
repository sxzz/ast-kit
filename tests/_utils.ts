import * as Acorn from 'acorn'
import { test } from 'vitest'
import { babelParse, babelParseExpression } from '../src'
import type { ParseResult } from '@babel/parser'
import type * as t from '@babel/types'
import type * as Estree from 'estree'

export function parse(code: string, expression?: false): ParseResult<t.Program>
export function parse<T extends t.Node>(
  code: string,
  expression: true,
): ParseResult<T>
export function parse<T extends t.Node>(code: string, expression = false) {
  return (expression ? babelParseExpression<T> : babelParse)(code, undefined, {
    sourceType: 'module',
    plugins: ['typescript', 'importAttributes'],
    errorRecovery: true,
  })
}

export function acornParse(code: string, expression?: false): Acorn.Program
export function acornParse<T extends Estree.Node>(
  code: string,
  expression: true,
): T
export function acornParse(code: string, expression = false) {
  const options: Acorn.Options = {
    ecmaVersion: 'latest',
    sourceType: 'module',
  }
  if (expression) {
    return Acorn.parseExpressionAt(code, 0, options)
  }
  return Acorn.parse(code, options)
}

export function testParsers(fn: (parser: string) => void): void {
  test.each(['babel', 'estree'])('%s format', fn)
}
