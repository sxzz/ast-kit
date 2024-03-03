import { parseExpression } from '@babel/parser'
import { isTypeOf } from './check'
import type * as t from '@babel/types'

export const TS_NODE_TYPES: readonly [
  'TSAsExpression',
  'TSTypeAssertion',
  'TSNonNullExpression',
  'TSInstantiationExpression',
  'TSSatisfiesExpression',
] = [
  'TSAsExpression', // foo as number
  'TSTypeAssertion', // (<number>foo)
  'TSNonNullExpression', // foo!
  'TSInstantiationExpression', // foo<string>
  'TSSatisfiesExpression', // foo satisfies T
] as const satisfies readonly t.Node['type'][]

/**
 * Unwraps a TypeScript node by recursively traversing the AST until a non-TypeScript node is found.
 * @param node - The TypeScript node to unwrap.
 * @returns The unwrapped node.
 */
export function unwrapTSNode(node: t.Node): t.Node {
  if (isTypeOf(node, TS_NODE_TYPES)) {
    return unwrapTSNode(node.expression)
  } else {
    return node
  }
}

/**
 * Escapes a raw key by checking if it needs to be wrapped with quotes or not.
 *
 * @param rawKey - The raw key to escape.
 * @returns The escaped key.
 */
export function escapeKey(rawKey: string): string {
  if (String(+rawKey) === rawKey) return rawKey
  try {
    const node = parseExpression(`({${rawKey}: 1})`) as t.ObjectExpression
    if ((node.properties[0] as t.ObjectProperty).key.type === 'Identifier')
      return rawKey
  } catch {}
  return JSON.stringify(rawKey)
}
