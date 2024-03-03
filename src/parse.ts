import {
  type ParserOptions,
  type ParserPlugin,
  type ParseResult as _ParseResult,
  parse,
  parseExpression,
} from '@babel/parser'
import { REGEX_LANG_JSX, isTs } from './lang'
import type * as t from '@babel/types'

export type ParseResult<T> = _ParseResult<T> & {
  comments?: t.Comment[] | null
}

function hasPlugin(
  plugins: ParserPlugin[],
  plugin: Exclude<ParserPlugin, any[]>,
) {
  return plugins.some((p) => (Array.isArray(p) ? p[0] : p) === plugin)
}

function getParserOptions(
  lang?: string,
  options: ParserOptions = {},
): ParserOptions {
  const plugins: ParserPlugin[] = [...(options.plugins || [])]
  if (isTs(lang)) {
    if (!hasPlugin(plugins, 'typescript')) {
      plugins.push(
        lang === 'dts' ? ['typescript', { dts: true }] : 'typescript',
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

/**
 * Parses the given code using Babel parser.
 *
 * @param code - The code to parse.
 * @param lang - The language of the code (optional).
 * @param options - The parser options (optional).
 * @returns The parse result, including the program, errors, and comments.
 */
export function babelParse(
  code: string,
  lang?: string,
  options: ParserOptions = {},
): ParseResult<t.Program> {
  const { program, errors, comments } = parse(
    code,
    getParserOptions(lang, options),
  )
  return { ...program, errors, comments }
}

/**
 * Parses the given code using the Babel parser as an expression.
 *
 * @template T - The type of the parsed AST node.
 * @param {string} code - The code to parse.
 * @param {string} [lang] - The language to parse. Defaults to undefined.
 * @param {ParserOptions} [options] - The options to configure the parser. Defaults to an empty object.
 * @returns {ParseResult<T>} - The result of the parsing operation.
 */
export function babelParseExpression<T extends t.Node = t.Expression>(
  code: string,
  lang?: string,
  options: ParserOptions = {},
): ParseResult<T> {
  return parseExpression(
    code,
    getParserOptions(lang, options),
  ) as ParseResult<T>
}
