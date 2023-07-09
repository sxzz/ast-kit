import type * as t from '@babel/types'

type NodeType = t.Node['type'] | 'Function' | 'Literal'
export type GetNode<K extends NodeType> = K extends 'Function'
  ? t.Function
  : K extends 'Literal'
  ? t.Literal
  : Extract<t.Node, { type: K }>

export function isTypeOf<K extends NodeType>(
  node: t.Node | undefined | null,
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
  node: t.Node | null | undefined,
  test: string | string[] | ((id: string) => boolean)
): node is t.CallExpression {
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
  node: t.Node | undefined | null,
  test: string | string[]
): node is t.Identifier {
  return (
    !!node &&
    node.type === 'Identifier' &&
    (typeof test === 'string' ? node.name === test : test.includes(node.name))
  )
}

export function isLiteralType(
  node: t.Node | undefined | null
): node is t.Literal {
  return !!node && node.type.endsWith('Literal')
}

export function isFunctionType(
  node: t.Node | undefined | null
): node is t.Function {
  return !!node && /Function(?:Expression|Declaration)$|Method$/.test(node.type)
}
