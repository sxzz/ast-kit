import {
  type CallExpression,
  type Function,
  type Identifier,
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

export function isIdentifierOf(
  node: Node | undefined | null,
  test: string | string[]
): node is Identifier {
  return (
    !!node &&
    node.type === 'Identifier' &&
    (typeof test === 'string' ? node.name === test : test.includes(node.name))
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
