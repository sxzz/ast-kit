import { walk } from 'estree-walker'
import { resolveString } from './resolve'
import type {
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  Node,
} from '@babel/types'

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

export interface ImportBinding {
  local: string
  imported: string
  source: string
  specifier: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier
}

export function walkImportDeclaration(
  imports: Record<string, ImportBinding>,
  node: ImportDeclaration
) {
  const source = node.source.value
  for (const specifier of node.specifiers) {
    if (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
      continue
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
    }
  }
}
