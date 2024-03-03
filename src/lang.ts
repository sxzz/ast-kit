import { extname } from 'pathe'

export const REGEX_DTS = /\.d\.[cm]?ts(\?.*)?$/
export const REGEX_LANG_TS = /^[cm]?tsx?$/
export const REGEX_LANG_JSX = /^[cm]?[jt]sx$/

export function getLang(filename: string): string {
  if (isDts(filename)) return 'dts'
  return extname(filename).replace(/^\./, '').replace(/\?.*$/, '')
}

export function isDts(filename: string): boolean {
  return REGEX_DTS.test(filename)
}

export function isTs(lang?: string): boolean {
  return !!lang && (lang === 'dts' || REGEX_LANG_TS.test(lang))
}
