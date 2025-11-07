import { isLiteralType, isTypeOf } from './check'
import type * as t from '@babel/types'

/**
 * Resolves a string representation of the given node.
 * @param node The node to resolve.
 * @param computed Whether the node is computed or not.
 * @returns The resolved string representation of the node.
 */
export function resolveString(
  node:
    | string
    | t.Identifier
    | t.Literal
    | t.PrivateName
    | t.ThisExpression
    | t.Super,
  computed = false,
): string {
  if (typeof node === 'string') return node
  else
    switch (node.type) {
      case 'Identifier': {
        if (computed) throw new TypeError('Invalid Identifier')
        return node.name
      }
      case 'PrivateName': {
        return `#${node.id.name}`
      }
      case 'ThisExpression': {
        return 'this'
      }
      case 'Super': {
        return 'super'
      }
      // No default
    }
  return String(resolveLiteral(node))
}

/**
 * Resolves the value of a literal node.
 * @param node The literal node to resolve.
 * @returns The resolved value of the literal node.
 */
export function resolveLiteral(
  node: t.Literal,
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

    /* v8 ignore next -- @preserve */
    case 'DecimalLiteral':
      return Number(node.value)
  }
}

/**
 * Resolves a template literal node into a string.
 * @param node The template literal node to resolve.
 * @returns The resolved string representation of the template literal.
 */
export function resolveTemplateLiteral(node: t.TemplateLiteral): string {
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

/**
 * Resolves the identifier node into an array of strings.
 * @param node The identifier node to resolve.
 * @returns An array of resolved strings representing the identifier.
 * @throws TypeError If the identifier is invalid.
 */
export function resolveIdentifier(
  node:
    | t.Identifier
    | t.PrivateName
    | t.MemberExpression
    | t.ThisExpression
    | t.Super
    | t.TSEntityName,
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

export function tryResolveIdentifier(
  ...args: Parameters<typeof resolveIdentifier>
): string[] | undefined {
  try {
    return resolveIdentifier(...args)
  } catch {
    return
  }
}

export type ObjectPropertyLike =
  | t.ObjectMethod
  | t.ObjectProperty
  | t.TSMethodSignature
  | t.TSPropertySignature
  | t.ImportAttribute

/**
 * Resolves the key of an object property-like node.
 * @param node The object property-like node to resolve.
 * @param raw Whether to return the raw value of the key or not.
 * @returns The resolved key of the object property-like node.
 */
export function resolveObjectKey(
  node: ObjectPropertyLike,
  raw?: false,
): string | number
export function resolveObjectKey(node: ObjectPropertyLike, raw: true): string
export function resolveObjectKey(
  node: ObjectPropertyLike,
  raw = false,
): string | number {
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
