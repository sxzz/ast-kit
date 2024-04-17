import { asyncWalk, walk } from 'estree-walker'
import { resolveString } from './resolve'
import {
  type GetNode,
  type NodeType,
  isExpressionType,
  isTypeOf,
} from './check'
import type { LiteralUnion } from './types'
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
  index: number | null | undefined,
) => R

interface WalkHandlers<T, R> {
  enter?: WalkCallback<T, R>
  leave?: WalkCallback<T, R>
}

/**
 * Walks the AST and applies the provided handlers.
 *
 * @template T - The type of the AST node.
 * @param {T} node - The root node of the AST.
 * @param {WalkHandlers<T, void>} hooks - The handlers to be applied during the walk.
 * @returns {T | null} - The modified AST node or null if the node is removed.
 */
export const walkAST: <T = t.Node>(
  node: T,
  hooks: WalkHandlers<T, void>,
) => T | null = walk as any

/**
 * Asynchronously walks the AST starting from the given node,
 * applying the provided handlers to each node encountered.
 *
 * @template T - The type of the AST node.
 * @param {T} node - The root node of the AST.
 * @param {WalkHandlers<T, Promise<void>>} handlers - The handlers to be applied to each node.
 * @returns {Promise<T | null>} - A promise that resolves to the modified AST or null if the AST is empty.
 */
export const walkASTAsync: <T = t.Node>(
  node: T,
  handlers: WalkHandlers<T, Promise<void>>,
) => Promise<T | null> = asyncWalk as any

type SetupCallback<T extends NodeType = NodeType, N = GetNode<T>> = (
  this: WalkThis<N>,
  node: N,
  parent: T extends keyof t.ParentMaps ? t.ParentMaps[T] : t.Node | null,
  key: string | null | undefined,
  index: number | null | undefined,
) => void | Promise<void>

interface WalkSetup {
  onEnter: <T extends NodeType = NodeType>(
    type: T | T[] | SetupFilter<GetNode<T>> | WalkCallback<t.Node, void>,
    cb?: SetupCallback<T, GetNode<T>>,
  ) => void
  onLeave: <T extends NodeType = NodeType>(
    type: T | T[] | SetupFilter<GetNode<T>> | WalkCallback<t.Node, void>,
    cb?: SetupCallback<T, GetNode<T>>,
  ) => void
}

type SetupFilter<N extends t.Node = t.Node> = (
  this: WalkThis<t.Node>,
  node: t.Node,
  parent: t.Node | null | undefined,
  key: string | null | undefined,
  index: number | null | undefined,
) => node is N

/** @deprecated */
export async function walkASTSetup(
  node: t.Node,
  cb: (setup: WalkSetup) => void | Promise<void>,
): Promise<t.Node | null> {
  const callbacks: Record<
    'enter' | 'leave',
    { filter: SetupFilter; cb?: SetupCallback<any, any> }[]
  > = {
    enter: [],
    leave: [],
  }

  function getFilter<T extends NodeType, N extends t.Node = GetNode<T>>(
    types: T | T[] | SetupFilter<N> | WalkCallback<N, void>,
  ): SetupFilter<N> {
    if (typeof types === 'function') return types as any

    return (node): node is N =>
      isTypeOf(node, Array.isArray(types) ? types : [types])
  }

  const setup: WalkSetup = {
    onEnter(type, cb) {
      callbacks.enter.push({ filter: getFilter(type), cb })
    },
    onLeave(type, cb) {
      callbacks.leave.push({ filter: getFilter(type), cb })
    },
  }

  await cb(setup)

  return walkASTAsync(node, {
    async enter(...args) {
      for (const { filter, cb } of callbacks.enter) {
        if (!filter.apply(this, args)) continue
        await cb?.apply(this, args)
      }
    },
    async leave(...args) {
      for (const { filter, cb } of callbacks.leave) {
        if (!filter.apply(this, args)) continue
        await cb?.apply(this, args)
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

/**
 * Walks through an ImportDeclaration node and populates the provided imports object.
 *
 * @param imports - The object to store the import bindings.
 * @param node - The ImportDeclaration node to walk through.
 */
export function walkImportDeclaration(
  imports: Record<string, ImportBinding>,
  node: t.ImportDeclaration,
): void {
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

/**
 * Represents an export binding.
 */
export interface ExportBinding {
  local: string
  exported: LiteralUnion<'*' | 'default'>
  isType: boolean
  source: string | null
  specifier:
    | t.ExportSpecifier
    | t.ExportDefaultSpecifier
    | t.ExportNamespaceSpecifier
    | null
  declaration: t.Declaration | t.ExportDefaultDeclaration['declaration'] | null
}

/**
 * Walks through an ExportDeclaration node and populates the exports object with the relevant information.
 * @param exports - The object to store the export information.
 * @param node - The ExportDeclaration node to process.
 */
export function walkExportDeclaration(
  exports: Record<string, ExportBinding>,
  node: t.ExportDeclaration,
): void {
  let local: ExportBinding['local']
  let exported: ExportBinding['exported']
  let isType: ExportBinding['isType']
  let source: ExportBinding['source']
  let specifier: ExportBinding['specifier']
  let declaration: ExportBinding['declaration']

  function setExport() {
    exports[exported] = {
      source,
      local,
      exported,
      specifier,
      isType,
      declaration,
    }
  }

  if (node.type === 'ExportNamedDeclaration') {
    if (node.specifiers.length > 0) {
      for (const s of node.specifiers) {
        const isExportSpecifier = s.type === 'ExportSpecifier'
        isType =
          node.exportKind === 'type' ||
          (isExportSpecifier && s.exportKind === 'type')
        local = isExportSpecifier
          ? s.local.name
          : s.type === 'ExportNamespaceSpecifier'
            ? '*'
            : 'default'
        source = node.source ? node.source.value : null
        exported = isExportSpecifier
          ? resolveString(s.exported)
          : s.exported.name
        declaration = null
        specifier = s

        setExport()
      }
    } else if (node.specifiers.length === 0 && !!node.declaration) {
      // TODO: handle other nodeType
      if (node.declaration.type === 'VariableDeclaration') {
        for (const decl of node.declaration.declarations) {
          /* c8 ignore next 4 */
          if (decl.id.type !== 'Identifier') {
            // TODO destructuring
            continue
          }

          local = resolveString(decl.id)
          source = null
          exported = local
          isType = node.exportKind === 'type'
          declaration = node.declaration
          specifier = null

          setExport()
        }
      } else if (
        'id' in node.declaration &&
        node.declaration.id &&
        node.declaration.id.type === 'Identifier'
      ) {
        local = resolveString(node.declaration.id)
        source = null
        exported = local
        isType = node.exportKind === 'type'
        declaration = node.declaration
        specifier = null

        setExport()
        /* c8 ignore next 3 */
      } else {
        // TODO handle other nodeType
      }
    }

    return
  } else if (node.type === 'ExportDefaultDeclaration') {
    if (isExpressionType(node.declaration)) {
      local = 'name' in node.declaration ? node.declaration.name : 'default'
    } else {
      local = resolveString(node.declaration.id || 'default')
    }

    source = null
    exported = 'default'
    isType = false
    declaration = node.declaration
    specifier = null
  } else {
    local = '*'
    source = resolveString(node.source)
    exported = '*'
    isType = node.exportKind === 'type'
    specifier = null
    declaration = null
  }

  setExport()
}
