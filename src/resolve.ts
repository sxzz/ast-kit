import { isLiteralType } from './utils'
import type {
  Identifier,
  Literal,
  StringLiteral,
  TemplateLiteral,
} from '@babel/types'

export function resolveString(node: Identifier | StringLiteral) {
  return node.type === 'StringLiteral' ? node.value : node.name
}

export function resolveLiteral(
  node: Literal
): string | number | boolean | null | RegExp | bigint {
  switch (node.type) {
    case 'TemplateLiteral':
      return resolveTemplateLiteral(node)
    case 'NullLiteral':
      return null
    case 'BigIntLiteral':
      return BigInt(node.value)
    case 'RegExpLiteral':
      return new RegExp(node.pattern, node.flags)

    case 'BooleanLiteral':
    case 'NumericLiteral':
    case 'StringLiteral':
      return node.value

    case 'DecimalLiteral':
      return Number(node.value)
  }
}

export function resolveTemplateLiteral(node: TemplateLiteral) {
  return node.quasis.reduce((prev, curr, idx) => {
    const expr = node.expressions[idx]
    if (expr) {
      if (!isLiteralType(expr))
        throw new TypeError('TemplateLiteral expression must be a literal')
      return prev + curr.value.cooked + resolveLiteral(expr as Literal)
    }
    return prev + curr.value.cooked
  }, '')
}
