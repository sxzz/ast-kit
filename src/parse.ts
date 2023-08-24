import {
  type ParseResult,
  type ParserOptions,
  type ParserPlugin,
  parse,
  parseExpression,
} from '@babel/parser'
import { REGEX_LANG_JSX, isTs } from './lang'
import type * as t from '@babel/types'

function hasPlugin(
  plugins: ParserPlugin[],
  plugin: Exclude<ParserPlugin, any[]>
) {
  return plugins.some((p) => (Array.isArray(p) ? p[0] : p) === plugin)
}

function getParserOptions(
  lang?: string,
  options: ParserOptions = {}
): ParserOptions {
  const plugins: ParserPlugin[] = [...(options.plugins || [])]
  if (isTs(lang)) {
    if (!hasPlugin(plugins, 'typescript')) {
      plugins.push(
        lang === 'dts' ? ['typescript', { dts: true }] : 'typescript'
      )
    }

    if (
      !hasPlugin(plugins, 'decorators') &&
      !hasPlugin(plugins, 'decorators-legacy')
    ) {
      plugins.push('decorators-legacy')
    }

    if (
      !hasPlugin(plugins, 'importAttributes') &&
      !hasPlugin(plugins, 'importAssertions')
    ) {
      plugins.push(['importAttributes', { deprecatedAssertSyntax: true }])
    }

    if (!hasPlugin(plugins, 'explicitResourceManagement')) {
      plugins.push('explicitResourceManagement')
    }

    if (REGEX_LANG_JSX.test(lang!) && !hasPlugin(plugins, 'jsx')) {
      plugins.push('jsx')
    }
  } else if (!hasPlugin(plugins, 'jsx')) {
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
): ParseResult<t.Program> {
  const { program, errors } = parse(code, getParserOptions(lang, options))
  return { ...program, errors }
}

export function babelParseExpression<T extends t.Node = t.Expression>(
  code: string,
  lang?: string,
  options: ParserOptions = {}
) {
  return parseExpression(
    code,
    getParserOptions(lang, options)
  ) as ParseResult<T>
}
