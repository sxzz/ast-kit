import { isLiteralType, isTypeOf } from './utils'
import type {
  Identifier,
  Literal,
  MemberExpression,
  PrivateName,
  TemplateLiteral,
} from '@babel/types'

export function resolveString(
  node: Identifier | Literal | PrivateName,
  computed = false
) {
  if (node.type === 'Identifier') {
    if (computed) throw new TypeError('Invalid Identifier')
    return node.name
  } else if (node.type === 'PrivateName') {
    return `#${node.id.name}`
  }
  return String(resolveLiteral(node))
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

export function resolveIdentifier(
  node: Identifier | PrivateName | MemberExpression
): string[] {
  if (isTypeOf(node, ['Identifier', 'PrivateName']))
    return [resolveString(node)]

  if (isTypeOf(node.object, ['Identifier', 'MemberExpression'])) {
    const keys = resolveIdentifier(node.object)

    if (
      isLiteralType(node.property) ||
      isTypeOf(node.property, ['Identifier', 'PrivateName'])
    ) {
      keys.push(resolveString(node.property, node.computed))
    } else {
      throw new TypeError('Invalid Identifier')
    }
    return keys
  }

  throw new TypeError('Invalid Identifier')
}
