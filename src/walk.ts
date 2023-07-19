import { asyncWalk, walk } from 'estree-walker'
import { resolveString } from './resolve'
import { type LiteralUnion } from './types'
import { type GetNode, type NodeType, isTypeOf } from './check'
import type * as t from '@babel/types'

interface WalkThis<T> {
  skip: () => void
  remove: () => void
  replace: (node: T) => void
}

type WalkCallback<T, R> = (
  this: WalkThis<T>,
  node: T,
  parent: T | null | undefined,
  key: string | null | undefined,
  index: number | null | undefined
) => R

interface WalkHandlers<T, R> {
  enter?: WalkCallback<T, R>
  leave?: WalkCallback<T, R>
}

export const walkAST: <T = t.Node>(
  node: T,
  hooks: WalkHandlers<T, void>
) => T | null = walk as any

export const walkASTAsync: <T = t.Node>(
  node: T,
  handlers: WalkHandlers<T, Promise<void>>
) => Promise<T | null> = asyncWalk as any

type SetupCallback<T extends NodeType = NodeType, N = GetNode<T>> = (
  this: WalkThis<N>,
  node: N,
  parent: T extends keyof t.ParentMaps ? t.ParentMaps[T] : t.Node | null,
  key: string | null | undefined,
  index: number | null | undefined
) => void | Promise<void>
interface WalkSetup {
  onEnter<T extends NodeType = NodeType>(
    type: T | T[],
    cb: SetupCallback<T>
  ): void
  onLeave<T extends NodeType = NodeType>(
    type: T | T[],
    cb: SetupCallback<T>
  ): void
}

export async function walkASTSetup(
  node: t.Node,
  cb: (setup: WalkSetup) => void | Promise<void>
) {
  const callbacks: Record<
    'enter' | 'leave',
    {
      types: NodeType[]
      cb: SetupCallback<any, any>
    }[]
  > = {
    enter: [],
    leave: [],
  }

  const setup: WalkSetup = {
    onEnter(type, cb) {
      const types = Array.isArray(type) ? type : [type]
      callbacks.enter.push({ types, cb })
    },
    onLeave(type, cb) {
      const types = Array.isArray(type) ? type : [type]
      callbacks.leave.push({ types, cb })
    },
  }

  await cb(setup)

  return walkASTAsync(node, {
    async enter(node, parent, key, index) {
      for (const { types, cb } of callbacks.enter) {
        if (!isTypeOf(node, types)) continue
        await cb.call(this, node, parent, key, index)
      }
    },
    async leave(node, parent, key, index) {
      for (const { types, cb } of callbacks.leave) {
        if (!isTypeOf(node, types)) continue
        await cb.call(this, node, parent, key, index)
      }
    },
  })
}

export interface ImportBinding {
  local: string
  imported: LiteralUnion<'*' | 'default'>
  source: string
  specifier:
    | t.ImportSpecifier
    | t.ImportDefaultSpecifier
    | t.ImportNamespaceSpecifier
  isType: boolean
}

export function walkImportDeclaration(
  imports: Record<string, ImportBinding>,
  node: t.ImportDeclaration
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
