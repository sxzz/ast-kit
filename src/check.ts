import { shallowEqual } from './utils'
import type { Opts } from './types'
import type * as t from '@babel/types'

export type NodeType = t.Node['type'] | 'Function' | 'Literal' | 'Expression'
export type GetNode<K extends NodeType> = K extends 'Function'
  ? t.Function
  : K extends 'Literal'
    ? t.Literal
    : Extract<t.Node, { type: K }>

export function isTypeOf<K extends NodeType>(
  node: t.Node | undefined | null,
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

export function isCallOf(
  node: t.Node | null | undefined,
  test: string | string[] | ((id: string) => boolean),
): node is t.CallExpression {
  return (
    !!node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    (typeof test === 'string'
      ? node.callee.name === test
      : Array.isArray(test)
        ? test.includes(node.callee.name)
        : test(node.callee.name))
  )
}

export function isIdentifierOf(
  node: t.Node | undefined | null,
  test: string | string[],
): node is t.Identifier {
  return (
    !!node &&
    node.type === 'Identifier' &&
    (typeof test === 'string' ? node.name === test : test.includes(node.name))
  )
}

export function isLiteralType(
  node: t.Node | undefined | null,
): node is t.Literal {
  return !!node && node.type.endsWith('Literal')
}

export function isFunctionType(
  node: t.Node | undefined | null,
): node is t.Function {
  return !!node && /Function(?:Expression|Declaration)$|Method$/.test(node.type)
}

/**
 * @see https://github.com/babel/babel/blob/d7f8401f14779d5615c3ae5d669afcb76dc30432/packages/babel-types/src/validators/generated/index.ts#L2633C1-L2708C2
 */
export function isExpressionType(
  node: t.Node | null | undefined,
  opts?: Opts<t.Expression> | null,
): node is t.Expression {
  if (!node) return false

  switch (node.type) {
    case 'ArrayExpression':
    case 'AssignmentExpression':
    case 'BinaryExpression':
    case 'CallExpression':
    case 'ConditionalExpression':
    case 'FunctionExpression':
    case 'Identifier':
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'NullLiteral':
    case 'BooleanLiteral':
    case 'RegExpLiteral':
    case 'LogicalExpression':
    case 'MemberExpression':
    case 'NewExpression':
    case 'ObjectExpression':
    case 'SequenceExpression':
    case 'ParenthesizedExpression':
    case 'ThisExpression':
    case 'UnaryExpression':
    case 'UpdateExpression':
    case 'ArrowFunctionExpression':
    case 'ClassExpression':
    case 'ImportExpression':
    case 'MetaProperty':
    case 'Super':
    case 'TaggedTemplateExpression':
    case 'TemplateLiteral':
    case 'YieldExpression':
    case 'AwaitExpression':
    case 'Import':
    case 'BigIntLiteral':
    case 'OptionalMemberExpression':
    case 'OptionalCallExpression':
    case 'TypeCastExpression':
    case 'JSXElement':
    case 'JSXFragment':
    case 'BindExpression':
    case 'DoExpression':
    case 'RecordExpression':
    case 'TupleExpression':
    case 'DecimalLiteral':
    case 'ModuleExpression':
    case 'TopicReference':
    case 'PipelineTopicExpression':
    case 'PipelineBareFunction':
    case 'PipelinePrimaryTopicReference':
    case 'TSInstantiationExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSTypeAssertion':
    case 'TSNonNullExpression':
      break
    case 'Placeholder':
      switch (node.expectedNode) {
        case 'Expression':
        case 'Identifier':
        case 'StringLiteral':
          break
        default:
          return false
      }
      break
    default:
      return false
  }

  return opts == null || shallowEqual(node, opts)
}

/**
 * Check if the input `node` is a reference to a bound variable.
 *
 * Copied from https://github.com/babel/babel/blob/main/packages/babel-types/src/validators/isReferenced.ts
 * To avoid runtime dependency on @babel/types (which includes process references)
 * This file should not change very often in babel but we may need to keep it
 * up-to-date from time to time.
 *
 * https://github.com/babel/babel/blob/main/LICENSE
 */
export function isReferenced(
  node: t.Node,
  parent: t.Node,
  grandparent?: t.Node,
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
