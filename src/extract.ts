import type * as t from '@babel/types'

/**
 * Extract identifiers of the given node.
 * @param node The node to extract.
 * @param identifiers The array to store the extracted identifiers.
 * @see https://github.com/vuejs/core/blob/1f6a1102aa09960f76a9af2872ef01e7da8538e3/packages/compiler-core/src/babelUtils.ts#L208
 */
export function extractIdentifiers(
  node: t.Node,
  identifiers: t.Identifier[] = [],
): t.Identifier[] {
  switch (node.type) {
    case 'Identifier':
    case 'JSXIdentifier':
      identifiers.push(node as t.Identifier)
      break

    case 'MemberExpression':
    case 'JSXMemberExpression': {
      let object: any = node
      while (object.type === 'MemberExpression') {
        object = object.object
      }
      identifiers.push(object)
      break
    }

    case 'ObjectPattern':
      for (const prop of node.properties) {
        if (prop.type === 'RestElement') {
          extractIdentifiers(prop.argument, identifiers)
        } else {
          extractIdentifiers(prop.value, identifiers)
        }
      }
      break

    case 'ArrayPattern':
      node.elements.forEach((element) => {
        element && extractIdentifiers(element, identifiers)
      })
      break

    case 'RestElement':
      extractIdentifiers(node.argument, identifiers)
      break

    case 'AssignmentPattern':
      extractIdentifiers(node.left, identifiers)
      break
  }

  return identifiers
}

export const isStaticProperty = (node: t.Node): node is t.ObjectProperty =>
  node &&
  (node.type === 'ObjectProperty' || node.type === 'ObjectMethod') &&
  !node.computed

export const isStaticPropertyKey = (node: t.Node, parent: t.Node): boolean =>
  isStaticProperty(parent) && parent.key === node
