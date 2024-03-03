import { parseExpression } from '@babel/parser'
import { isTypeOf } from './check'
import type * as t from '@babel/types'

export const TS_NODE_TYPES = [
  'TSAsExpression', // foo as number
  'TSTypeAssertion', // (<number>foo)
  'TSNonNullExpression', // foo!
  'TSInstantiationExpression', // foo<string>
  'TSSatisfiesExpression', // foo satisfies T
] as const satisfies readonly t.Node['type'][]
export function unwrapTSNode(node: t.Node): t.Node {
  if (isTypeOf(node, TS_NODE_TYPES)) {
    return unwrapTSNode(node.expression)
  } else {
    return node
  }
}

export function escapeKey(rawKey: string): string {
  if (String(+rawKey) === rawKey) return rawKey
  try {
    const node = parseExpression(`({${rawKey}: 1})`) as t.ObjectExpression
    if ((node.properties[0] as t.ObjectProperty).key.type === 'Identifier')
      return rawKey
  } catch {}
  return JSON.stringify(rawKey)
}
