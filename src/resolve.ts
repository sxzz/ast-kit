import { isLiteralType, isTypeOf } from './check'
import type * as t from '@babel/types'

export function resolveString(
  node:
    | string
    | t.Identifier
    | t.Literal
    | t.PrivateName
    | t.ThisExpression
    | t.Super,
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
  node: t.Literal
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

export function resolveTemplateLiteral(node: t.TemplateLiteral) {
  return node.quasis.reduce((prev, curr, idx) => {
    const expr = node.expressions[idx]
    if (expr) {
      if (!isLiteralType(expr))
        throw new TypeError('TemplateLiteral expression must be a literal')
      return prev + curr.value.cooked + resolveLiteral(expr as t.Literal)
    }
    return prev + curr.value.cooked
  }, '')
}

export function resolveIdentifier(
  node:
    | t.Identifier
    | t.PrivateName
    | t.MemberExpression
    | t.ThisExpression
    | t.Super
    | t.TSEntityName
): string[] {
  if (isTypeOf(node, ['Identifier', 'PrivateName', 'ThisExpression', 'Super']))
    return [resolveString(node)]

  const left = node.type === 'TSQualifiedName' ? node.left : node.object
  const right = node.type === 'TSQualifiedName' ? node.right : node.property
  const computed = node.type === 'TSQualifiedName' ? false : node.computed

  if (
    isTypeOf(left, [
      'Identifier',
      'MemberExpression',
      'ThisExpression',
      'Super',
      'TSQualifiedName',
    ])
  ) {
    const keys = resolveIdentifier(left)

    if (isTypeOf(right, ['Identifier', 'PrivateName', 'Literal'])) {
      keys.push(resolveString(right, computed))
    } else {
      throw new TypeError('Invalid Identifier')
    }
    return keys
  }

  throw new TypeError('Invalid Identifier')
}

export type ObjectPropertyLike =
  | t.ObjectMethod
  | t.ObjectProperty
  | t.TSMethodSignature
  | t.TSPropertySignature
  | t.ImportAttribute

export function resolveObjectKey(
  node: ObjectPropertyLike,
  raw?: false
): string | number
export function resolveObjectKey(node: ObjectPropertyLike, raw: true): string
export function resolveObjectKey(node: ObjectPropertyLike, raw = false) {
  // @ts-expect-error computed is missing in ImportAttribute
  const { key, computed } = node
  switch (key.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
      return raw ? (key.extra!.raw as string) : key.value
    case 'Identifier':
      if (!computed) return raw ? `"${key.name}"` : key.name
      throw 'Cannot resolve computed Identifier'
    default:
      throw new SyntaxError(`Unexpected node type: ${key.type}`)
  }
}
