import {
  type CallExpression,
  type Function,
  type Literal,
  type Node,
} from '@babel/types'

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
]
export function unwrapTSNode(node: Node): Node {
  if (TS_NODE_TYPES.includes(node.type)) {
    return unwrapTSNode((node as any).expression)
  } else {
    return node
  }
}
