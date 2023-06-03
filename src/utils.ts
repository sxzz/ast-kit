import {
  type CallExpression,
  type Function,
  type Literal,
  type Node,
} from '@babel/types'

type NodeType = Node['type'] | 'Function' | 'Literal'
export type GetNode<K extends NodeType> = K extends 'Function'
  ? Function
  : K extends 'Literal'
  ? Literal
  : Extract<Node, { type: K }>

export function isTypeOf<K extends NodeType>(
  node: Node,
  types: Readonly<K[]>
): node is GetNode<K> {
  return types.some((type) => {
    if (type === 'Function') {
      return isFunctionType(node)
    } else if (type === 'Literal') {
      return isLiteralType(node)
    } else {
      return node?.type === type
    }
  })
}

export function isCallOf(
  node: Node | null | undefined,
  test: string | string[] | ((id: string) => boolean)
): node is CallExpression {
  return !!(
    node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    (typeof test === 'string'
      ? node.callee.name === test
      : Array.isArray(test)
      ? test.includes(node.callee.name)
      : test(node.callee.name))
  )
}

export function isLiteralType(node: Node): node is Literal {
  return node.type.endsWith('Literal')
}

export function isFunctionType(node: Node): node is Function {
  return /Function(?:Expression|Declaration)$|Method$/.test(node.type)
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