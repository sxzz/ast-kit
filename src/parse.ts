import {
  type ParseResult,
  type ParserOptions,
  type ParserPlugin,
  parse,
  parseExpression,
} from '@babel/parser'
import { type Expression, type Program } from '@babel/types'
import { REGEX_LANG_JSX, isTs } from './lang'

function getParserOptions(
  lang?: string,
  options: ParserOptions = {}
): ParserOptions {
  const plugins: ParserPlugin[] = [...(options.plugins || [])]
  if (isTs(lang)) {
    plugins.push(lang === 'dts' ? ['typescript', { dts: true }] : 'typescript')
    if (REGEX_LANG_JSX.test(lang!)) plugins.push('jsx')
    if (!plugins.includes('decorators')) plugins.push('decorators-legacy')
  } else {
    plugins.push('jsx')
  }
  return {
    sourceType: 'module',
    ...options,
    plugins,
  }
}

export function babelParse(
  code: string,
  lang?: string,
  options: ParserOptions = {}
): ParseResult<Program> {
  const { program, errors } = parse(code, getParserOptions(lang, options))
  return { ...program, errors }
}

export function babelParseExpression(
  code: string,
  lang?: string,
  options: ParserOptions = {}
): ParseResult<Expression> {
  return parseExpression(code, getParserOptions(lang, options))
}
