import {
  type Identifier,
  type Literal,
  type MemberExpression,
  type PrivateName,
  type Super,
  type TemplateLiteral,
  type ThisExpression,
} from '@babel/types'
import { isLiteralType, isTypeOf } from './utils'

export function resolveString(
  node: string | Identifier | Literal | PrivateName | ThisExpression | Super,
  computed = false
) {
  if (typeof node === 'string') return node
  else if (node.type === 'Identifier') {
    if (computed) throw new TypeError('Invalid Identifier')
    return node.name
  } else if (node.type === 'PrivateName') {
    return `#${node.id.name}`
  } else if (node.type === 'ThisExpression') {
    return 'this'
  } else if (node.type === 'Super') {
    return 'super'
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
  node: Identifier | PrivateName | MemberExpression | ThisExpression | Super
): string[] {
  if (isTypeOf(node, ['Identifier', 'PrivateName', 'ThisExpression', 'Super']))
    return [resolveString(node)]

  if (
    isTypeOf(node.object, [
      'Identifier',
      'MemberExpression',
      'ThisExpression',
      'Super',
    ])
  ) {
    const keys = resolveIdentifier(node.object)

    if (isTypeOf(node.property, ['Identifier', 'PrivateName', 'Literal'])) {
      keys.push(resolveString(node.property, node.computed))
    } else {
      throw new TypeError('Invalid Identifier')
    }
    return keys
  }

  throw new TypeError('Invalid Identifier')
}
