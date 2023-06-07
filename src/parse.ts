import { type ParserOptions, type ParserPlugin, parse } from '@babel/parser'
import { type Program } from '@babel/types'
import { REGEX_LANG_JSX, isTs } from './lang'

export function babelParse(
  code: string,
  lang?: string,
  options: ParserOptions = {}
): Program {
  const plugins: ParserPlugin[] = [...(options.plugins || [])]
  if (isTs(lang)) {
    plugins.push(lang === 'dts' ? ['typescript', { dts: true }] : 'typescript')
    if (REGEX_LANG_JSX.test(lang!)) plugins.push('jsx')
    if (!plugins.includes('decorators')) plugins.push('decorators-legacy')
  } else {
    plugins.push('jsx')
  }
  const { program } = parse(code, {
    sourceType: 'module',
    ...options,
    plugins,
  })
  return program
}
