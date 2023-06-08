import {
  type Node,
  type ObjectExpression,
  type ObjectProperty,
} from '@babel/types'
import { parseExpression } from '@babel/parser'
import { isTypeOf } from './check'

export const TS_NODE_TYPES = [
  'TSAsExpression', // foo as number
  'TSTypeAssertion', // (<number>foo)
  'TSNonNullExpression', // foo!
  'TSInstantiationExpression', // foo<string>
  'TSSatisfiesExpression', // foo satisfies T
] as const satisfies readonly Node['type'][]
export function unwrapTSNode(node: Node): Node {
  if (isTypeOf(node, TS_NODE_TYPES)) {
    return unwrapTSNode(node.expression)
  } else {
    return node
  }
}

export function escapeKey(rawKey: string) {
  if (String(+rawKey) === rawKey) return rawKey
  try {
    const node = parseExpression(`({${rawKey}: 1})`) as ObjectExpression
    if ((node.properties[0] as ObjectProperty).key.type === 'Identifier')
      return rawKey
  } catch {}
  return JSON.stringify(rawKey)
}
