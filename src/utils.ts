import {
  type CallExpression,
  type Function,
  type Literal,
  type Node,
  type ObjectExpression,
  type ObjectProperty,
} from '@babel/types'
import { parseExpression } from '@babel/parser'

type NodeType = Node['type'] | 'Function' | 'Literal'
export type GetNode<K extends NodeType> = K extends 'Function'
  ? Function
  : K extends 'Literal'
  ? Literal
  : Extract<Node, { type: K }>

export function isTypeOf<K extends NodeType>(
  node: Node | undefined | null,
  types: Readonly<K[]>
): node is GetNode<K> {
  if (!node) return false
  return types.some((type) => {
    if (type === 'Function') {
      return isFunctionType(node)
    } else if (type === 'Literal') {
      return isLiteralType(node)
    } else {
      return node.type === type
    }
  })
}

export function isCallOf(
  node: Node | null | undefined,
  test: string | string[] | ((id: string) => boolean)
): node is CallExpression {
  return (
    !!node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    (typeof test === 'string'
      ? node.callee.name === test
      : Array.isArray(test)
      ? test.includes(node.callee.name)
      : test(node.callee.name))
  )
}

export function isLiteralType(node: Node | undefined | null): node is Literal {
  return !!node && node.type.endsWith('Literal')
}

export function isFunctionType(
  node: Node | undefined | null
): node is Function {
  return !!node && /Function(?:Expression|Declaration)$|Method$/.test(node.type)
}

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
