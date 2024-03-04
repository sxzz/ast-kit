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
      identifiers.push(node)
      break

    case 'MemberExpression':
      // eslint-disable-next-line no-case-declarations
      let object: any = node
      while (object.type === 'MemberExpression') {
        object = object.object
      }
      identifiers.push(object)
      break

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
        if (element) extractIdentifiers(element, identifiers)
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
