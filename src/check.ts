import type * as t from '@babel/types'
// @ts-ignore
import type * as estree from 'estree'

type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
type IfEstree<T> = IfAny<typeof estree, never, T>

export type Node =
  | t.Node
  | IfEstree<
      | estree.Node
      | estree.MaybeNamedClassDeclaration
      | estree.MaybeNamedFunctionDeclaration
    >
export type Literal =
  | t.Literal
  | IfEstree<estree.Literal | estree.TemplateLiteral>

/**
 * All possible node types.
 */
export type NodeType =
  | Node['type']
  | 'Function'
  | 'Literal'
  | 'Expression'
  | 'Declaration'

/**
 * Represents the corresponding node based on the given node type.
 */
export type GetNode<K extends NodeType> = K extends 'Function'
  ? t.Function | IfEstree<estree.Function>
  : K extends 'Expression'
    ? t.Expression | IfEstree<estree.Expression>
    : K extends 'Declaration'
      ? t.Declaration | IfEstree<estree.Declaration>
      : K extends 'Literal'
        ? Literal
        : Extract<Node, { type: K }>

/**
 * Checks if the given node matches the specified type(s).
 *
 * @param node - The node to check.
 * @param types - The type(s) to match against. It can be a single type or an array of types.
 * @returns True if the node matches the specified type(s), false otherwise.
 */
export function isTypeOf<K extends NodeType>(
  node: Node | undefined | null,
  types: K | Readonly<K[]>,
): node is GetNode<K> {
  if (!node) return false
  return ([] as string[]).concat(types).some((type) => {
    if (type === 'Function') {
      return isFunctionType(node)
    } else if (type === 'Literal') {
      return isLiteralType(node)
    } else if (type === 'Expression') {
      return isExpressionType(node)
    } else {
      return node.type === type
    }
  })
}

/**
 * Checks if the given node is a CallExpression with the specified callee.
 *
 * @param node - The node to check.
 * @param test - The callee to compare against. It can be a string, an array of strings, or a function that takes a string and returns a boolean.
 * @returns True if the node is a CallExpression with the specified callee, false otherwise.
 */
export function isCallOf(
  node: Node | null | undefined,
  test: string | string[] | ((id: string) => boolean),
): node is GetNode<'CallExpression'> {
  return (
    !!node &&
    node.type === 'CallExpression' &&
    isIdentifierOf(node.callee, test)
  )
}

/**
 * Checks if the given node is a TaggedTemplateExpression with the specified callee.
 *
 * @param node - The node to check.
 * @param test - The callee to compare against. It can be a string, an array of strings, or a function that takes a string and returns a boolean.
 * @returns True if the node is a TaggedTemplateExpression with the specified callee, false otherwise.
 */
export function isTaggedFunctionCallOf(
  node: t.Node | null | undefined,
  test: string | string[] | ((id: string) => boolean),
): node is t.TaggedTemplateExpression {
  return (
    !!node &&
    node.type === 'TaggedTemplateExpression' &&
    isIdentifierOf(node.tag, test)
  )
}

/**
 * Checks if the given node is an Identifier with the specified name.
 *
 * @param node - The node to check.
 * @param test - The name to compare against. It can be a string or an array of strings.
 * @returns True if the node is an Identifier with the specified name, false otherwise.
 */
export function isIdentifierOf(
  node: Node | undefined | null,
  test: string | string[] | ((id: string) => boolean),
): node is GetNode<'Identifier'> {
  return !!node && node.type === 'Identifier' && match(node.name, test)
}

/**
 * Checks if the given node is a literal type.
 *
 * @param node - The node to check.
 * @returns True if the node is a literal type, false otherwise.
 */
export function isLiteralType(node: Node | undefined | null): node is Literal {
  return !!node && node.type.endsWith('Literal')
}

/**
 * Checks if the given node is a function type.
 *
 * @param node - The node to check.
 * @returns True if the node is a function type, false otherwise.
 */
export function isFunctionType(
  node: Node | undefined | null,
): node is GetNode<'Function'> {
  return (
    !!node &&
    !node.type.startsWith('TS') &&
    /Function(?:Expression|Declaration)$|Method$/.test(node.type)
  )
}

/**
 * Checks if the given node is a declaration type.
 *
 * @param node - The node to check.
 * @returns True if the node is a declaration type, false otherwise.
 */
export function isDeclarationType(
  node: t.Node | undefined | null,
): node is t.Declaration {
  if (!node) return false
  switch (node.type) {
    case 'FunctionDeclaration':
    case 'VariableDeclaration':
    case 'ClassDeclaration':
    case 'ExportAllDeclaration':
    case 'ExportDefaultDeclaration':
    case 'ExportNamedDeclaration':
    case 'ImportDeclaration':
    case 'DeclareClass':
    case 'DeclareFunction':
    case 'DeclareInterface':
    case 'DeclareModule':
    case 'DeclareModuleExports':
    case 'DeclareTypeAlias':
    case 'DeclareOpaqueType':
    case 'DeclareVariable':
    case 'DeclareExportDeclaration':
    case 'DeclareExportAllDeclaration':
    case 'InterfaceDeclaration':
    case 'OpaqueType':
    case 'TypeAlias':
    case 'EnumDeclaration':
    case 'TSDeclareFunction':
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
    case 'TSEnumDeclaration':
    case 'TSModuleDeclaration':
      return true
    case 'Placeholder':
      if (node.expectedNode === 'Declaration') return true
  }
  return false
}

/**
 * Checks if the given node is an expression type.
 *
 * @param node - The node to check.
 * @returns True if the node is an expression type, false otherwise.
 */
export function isExpressionType(
  node: Node | null | undefined,
): node is GetNode<'Expression'> {
  return (
    !!node &&
    (node.type.endsWith('Expression') ||
      isLiteralType(node) ||
      [
        'Identifier',
        'MetaProperty',
        'Super',
        'Import',
        'JSXElement',
        'JSXFragment',
        'TopicReference',
        'PipelineBareFunction',
        'PipelinePrimaryTopicReference',
        'TSTypeAssertion',
      ].includes(node.type))
  )
}

function match<T extends string | number | boolean>(
  value: T,
  test: T | T[] | ((id: T) => boolean),
): boolean {
  if (Array.isArray(test)) return test.includes(value)
  if (typeof test === 'function') return test(value)
  return value === test
}

/* v8 ignore start */

/**
 * Checks if the input `node` is a reference to a bound variable.
 *
 * Copied from https://github.com/babel/babel/blob/main/packages/babel-types/src/validators/isReferenced.ts
 *
 * To avoid runtime dependency on `@babel/types` (which includes process references)
 * This file should not change very often in babel but we may need to keep it
 * up-to-date from time to time.
 *
 * @param node - The node to check.
 * @param parent - The parent node of the input `node`.
 * @param grandparent - The grandparent node of the input `node`.
 * @returns True if the input `node` is a reference to a bound variable, false otherwise.
 */
export function isReferenced(
  node: Node,
  parent: Node,
  grandparent?: Node,
): boolean {
  switch (parent.type) {
    // yes: PARENT[NODE]
    // yes: NODE.child
    // no: parent.NODE
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      if (parent.property === node) {
        return !!parent.computed
      }
      return parent.object === node

    case 'JSXMemberExpression':
      return parent.object === node
    // no: let NODE = init;
    // yes: let id = NODE;
    case 'VariableDeclarator':
      return parent.init === node

    // yes: () => NODE
    // no: (NODE) => {}
    case 'ArrowFunctionExpression':
      return parent.body === node

    // no: class { #NODE; }
    // no: class { get #NODE() {} }
    // no: class { #NODE() {} }
    // no: class { fn() { return this.#NODE; } }
    case 'PrivateName':
      return false

    // no: class { NODE() {} }
    // yes: class { [NODE]() {} }
    // no: class { foo(NODE) {} }
    case 'ClassMethod':
    case 'ClassPrivateMethod':
    case 'ObjectMethod':
      if (parent.key === node) {
        return !!parent.computed
      }
      return false

    // yes: { [NODE]: "" }
    // no: { NODE: "" }
    // depends: { NODE }
    // depends: { key: NODE }
    case 'ObjectProperty':
      if (parent.key === node) {
        return !!parent.computed
      }
      // parent.value === node
      return !grandparent || grandparent.type !== 'ObjectPattern'
    // no: class { NODE = value; }
    // yes: class { [NODE] = value; }
    // yes: class { key = NODE; }
    case 'ClassProperty':
    case 'ClassAccessorProperty':
      if (parent.key === node) {
        return !!parent.computed
      }
      return true
    case 'ClassPrivateProperty':
      return parent.key !== node

    // no: class NODE {}
    // yes: class Foo extends NODE {}
    case 'ClassDeclaration':
    case 'ClassExpression':
      return parent.superClass === node

    // yes: left = NODE;
    // no: NODE = right;
    case 'AssignmentExpression':
      return parent.right === node

    // no: [NODE = foo] = [];
    // yes: [foo = NODE] = [];
    case 'AssignmentPattern':
      return parent.right === node

    // no: NODE: for (;;) {}
    case 'LabeledStatement':
      return false

    // no: try {} catch (NODE) {}
    case 'CatchClause':
      return false

    // no: function foo(...NODE) {}
    case 'RestElement':
      return false

    case 'BreakStatement':
    case 'ContinueStatement':
      return false

    // no: function NODE() {}
    // no: function foo(NODE) {}
    case 'FunctionDeclaration':
    case 'FunctionExpression':
      return false

    // no: export NODE from "foo";
    // no: export * as NODE from "foo";
    case 'ExportNamespaceSpecifier':
    case 'ExportDefaultSpecifier':
      return false

    // no: export { foo as NODE };
    // yes: export { NODE as foo };
    // no: export { NODE as foo } from "foo";
    case 'ExportSpecifier':
      // @ts-expect-error todo(flow->ts): Property 'source' does not exist on type 'AnyTypeAnnotation'.
      if (grandparent?.source) {
        return false
      }
      return parent.local === node

    // no: import NODE from "foo";
    // no: import * as NODE from "foo";
    // no: import { NODE as foo } from "foo";
    // no: import { foo as NODE } from "foo";
    // no: import NODE from "bar";
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
    case 'ImportSpecifier':
      return false

    // no: import "foo" assert { NODE: "json" }
    case 'ImportAttribute':
      return false

    // no: <div NODE="foo" />
    case 'JSXAttribute':
      return false

    // no: [NODE] = [];
    // no: ({ NODE }) = [];
    case 'ObjectPattern':
    case 'ArrayPattern':
      return false

    // no: new.NODE
    // no: NODE.target
    case 'MetaProperty':
      return false

    // yes: type X = { someProperty: NODE }
    // no: type X = { NODE: OtherType }
    case 'ObjectTypeProperty':
      return parent.key !== node

    // yes: enum X { Foo = NODE }
    // no: enum X { NODE }
    case 'TSEnumMember':
      return parent.id !== node

    // yes: { [NODE]: value }
    // no: { NODE: value }
    case 'TSPropertySignature':
      if (parent.key === node) {
        return !!parent.computed
      }

      return true
  }

  return true
}

/* v8 ignore end */
