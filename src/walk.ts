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
      parent: T | null | undefined,
      key: string | null | undefined,
      index: number | null | undefined
    ) => void
    leave?: (
      this: {
        skip: () => void
        remove: () => void
        replace: (node: T) => void
      },
      node: T,
      parent: T | null | undefined,
      key: string | null | undefined,
      index: number | null | undefined
    ) => void
  }
): T {
  return (walk as any)(node, options)
}
