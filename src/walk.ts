import { asyncWalk, walk } from 'estree-walker'
import {
  type ImportDeclaration,
  type ImportDefaultSpecifier,
  type ImportNamespaceSpecifier,
  type ImportSpecifier,
  type Node,
} from '@babel/types'
import { resolveString } from './resolve'
import { type LiteralUnion } from './types'

type WalkHandlers<T, R> = {
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
  ) => R
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
  ) => R
}

export const walkAST: <T = Node>(
  node: T,
  hooks: WalkHandlers<T, void>
) => T | null = walk as any

export const walkASTAsync: <T = Node>(
  node: T,
  handlers: WalkHandlers<T, Promise<void>>
) => Promise<T | null> = asyncWalk as any

export interface ImportBinding {
  local: string
  imported: LiteralUnion<'*' | 'default'>
  source: string
  specifier: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier
  isType: boolean
}

export function walkImportDeclaration(
  imports: Record<string, ImportBinding>,
  node: ImportDeclaration
) {
  if (node.importKind === 'type') return
  const source = node.source.value
  for (const specifier of node.specifiers) {
    const isType =
      specifier.type === 'ImportSpecifier' && specifier.importKind === 'type'
    const local = specifier.local.name
    const imported =
      specifier.type === 'ImportSpecifier'
        ? resolveString(specifier.imported)
        : specifier.type === 'ImportNamespaceSpecifier'
        ? '*'
        : 'default'
    imports[local] = {
      source,
      local,
      imported,
      specifier,
      isType,
    }
  }
}
