import { isLiteralType, isTypeOf } from './check'
import { resolveString } from './resolve'
import type * as t from '@babel/types'

/**
 * Extract identifiers of the given node.
 * @param node The node to extract.
 * @param identifiers The array to store the extracted identifiers.
 * @see https://github.com/vuejs/core/blob/1f6a1102aa09960f76a9af2872ef01e7da8538e3/packages/compiler-core/src/babelUtils.ts#L208
 */
export const extractIdentifiers = createBindingsExtractor<t.Identifier>({
  onIdentifier: (identifiers, node) => {
    identifiers.push(node)
  },
  onMemberExpression: (identifiers, node) => {
    let object: any = node
    while (object.type === 'MemberExpression') {
      object = object.object
    }
    identifiers.push(object)
  },
  onObjectPattern: (identifiers, node) => {
    for (const prop of node.properties) {
      if (prop.type === 'RestElement') {
        extractIdentifiers(prop.argument, identifiers)
      } else {
        extractIdentifiers(prop.value, identifiers)
      }
    }
  },
  onArrayPattern: (identifiers, node) => {
    node.elements.forEach((element) => {
      element && extractIdentifiers(element, identifiers)
    })
  },
  onRestElement: (identifiers, node) => {
    extractIdentifiers(node.argument, identifiers)
  },
  onAssignmentPattern: (identifiers, node) => {
    extractIdentifiers(node.left, identifiers)
  },
})

// a helper for resolveObjectProperty
let keyName = ''

type ResolvedBinding = [key: string, value: string]

/**
 * Extract binding infos of the given node for walkExportDeclaration.
 * @param node The node to extract.
 * @param bindings The array to store the extracted bindings.
 */
export const extractBindings = createBindingsExtractor<
  ResolvedBinding,
  { isRoot?: boolean }
>({
  onIdentifier: (bindings, node) => {
    const name = resolveString(node)
    bindings.push([name, name])
  },
  onMemberExpression: (bindings, node) => {
    let n: any = node

    while (
      n.type === 'MemberExpression' &&
      n.object.type === 'MemberExpression'
    ) {
      n = n.object
    }

    bindings.push([resolveString(n.object), resolveString(n.property)])
  },
  onObjectPattern: (bindings, node, options) => {
    for (const prop of node.properties) {
      if (prop.type === 'ObjectProperty') {
        resolveObjectProperty(prop, bindings, !!options?.isRoot)
      } else {
        extractBindings(prop.argument, bindings, options)
      }
    }

    function resolveObjectProperty(
      n: t.ObjectProperty,
      res: ResolvedBinding[],
      isRoot: boolean,
    ) {
      if (n.key.type === 'Identifier' || isLiteralType(n.key)) {
        if (isRoot) {
          keyName = resolveString(n.key)
          isRoot = false
        }
      } else return

      if (
        isTypeOf(n.value, [
          'Identifier',
          'RestElement',
          'AssignmentPattern',
          'ArrayPattern',
          'ObjectPattern',
        ])
      ) {
        extractBindings(n.value, res, {
          isRoot,
          onIdentifier: (r, idNode) => {
            r.push([keyName, resolveString(idNode)])
          },
        })
      }
    }
  },
  onArrayPattern: (bindings, node, options) => {
    for (const el of node.elements) {
      el && extractBindings(el, bindings, options)
    }
  },
  onAssignmentPattern: (bindings, node, options) => {
    extractBindings(node.left, bindings, options)
  },
  onRestElement: (bindings, node, options) => {
    extractBindings(node.argument, bindings, options)
  },
})

type BingdingsResolver<T, N extends t.Node, ExtraOptions> = (
  bindings: T[],
  node: N,
  extraOptions?: BindingsExtractorOptions<T, ExtraOptions>,
) => void

type BindingsExtractorOptions<T, ExtraOptions> = {
  onIdentifier?: BingdingsResolver<T, t.Identifier, ExtraOptions>
  onArrayPattern?: BingdingsResolver<T, t.ArrayPattern, ExtraOptions>
  onObjectPattern?: BingdingsResolver<T, t.ObjectPattern, ExtraOptions>
  onMemberExpression?: BingdingsResolver<T, t.MemberExpression, ExtraOptions>
  onAssignmentPattern?: BingdingsResolver<T, t.AssignmentPattern, ExtraOptions>
  onRestElement?: BingdingsResolver<T, t.RestElement, ExtraOptions>
} & ExtraOptions

/**
 * Create a extractor to help extract binding infos that you want.
 * @param bindingsExtractorOptions The options that include the handlers for available node types.
 */
export function createBindingsExtractor<
  T,
  ExtraOptions extends Record<string, any> = {},
>(bindingsExtractorOptions: BindingsExtractorOptions<T, ExtraOptions>) {
  return (
    node: t.Node,
    bindings: T[] = [],
    options?: BindingsExtractorOptions<T, ExtraOptions>,
  ): T[] => {
    options = { ...bindingsExtractorOptions, ...options }

    const {
      onIdentifier,
      onArrayPattern,
      onObjectPattern,
      onMemberExpression,
      onAssignmentPattern,
      onRestElement,
    } = options

    switch (node.type) {
      case 'Identifier':
        onIdentifier?.(bindings, node, options)
        break

      case 'MemberExpression': {
        onMemberExpression?.(bindings, node, options)
        break
      }

      case 'ObjectPattern':
        onObjectPattern?.(bindings, node, options)
        break

      case 'ArrayPattern':
        onArrayPattern?.(bindings, node, options)
        break

      case 'RestElement':
        onRestElement?.(bindings, node, options)
        break

      case 'AssignmentPattern':
        onAssignmentPattern?.(bindings, node, options)
        break
    }

    return bindings
  }
}
