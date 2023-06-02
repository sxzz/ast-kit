import { walk } from 'estree-walker'
import type { Node } from '@babel/types'

export function walkAST<T = Node>(
  node: T,
  options: {
    enter?: (
      this: {
        skip: () => void
        remove: () => void
        replace: (node: T) => void
      },
      node: T,
      parent: T,
      key: string,
      index: number
    ) => void
    leave?: (
      this: {
        skip: () => void
        remove: () => void
        replace: (node: T) => void
      },
      node: T,
      parent: T,
      key: string,
      index: number
    ) => void
  }
): T {
  return walk(node as any, options as any) as any
}
