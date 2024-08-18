// copied from https://github.com/rollup/plugins/blob/master/packages/pluginutils/src/attachScopes.ts
// MIT License

/* c8 ignore start */

import { walkAST } from './walk'
import type {
  ArrayPattern,
  AssignmentPattern,
  Function,
  Identifier,
  Node,
  ObjectPattern,
  RestElement,
} from '@babel/types'

// copied from https://github.com/rollup/plugins/blob/master/packages/pluginutils/src/extractAssignedNames.ts
// MIT License
interface Extractors {
  [key: string]: (names: string[], param: any) => void
}

const extractors: Extractors = {
  ArrayPattern(names: string[], param: ArrayPattern) {
    for (const element of param.elements) {
      if (element) extractors[element.type](names, element)
    }
  },

  AssignmentPattern(names: string[], param: AssignmentPattern) {
    extractors[param.left.type](names, param.left)
  },

  Identifier(names: string[], param: Identifier) {
    names.push(param.name)
  },

  MemberExpression() {},

  ObjectPattern(names: string[], param: ObjectPattern) {
    for (const prop of param.properties) {
      // @ts-ignore Typescript reports that this is not a valid type
      if (prop.type === 'RestElement') {
        extractors.RestElement(names, prop)
      } else {
        extractors[prop.value.type](names, prop.value)
      }
    }
  },

  RestElement(names: string[], param: RestElement) {
    extractors[param.argument.type](names, param.argument)
  },
}

function extractAssignedNames(param: Node) {
  const names: string[] = []

  extractors[param.type](names, param)
  return names
}

export interface AttachedScope {
  parent?: AttachedScope
  isBlockScope: boolean
  declarations: { [key: string]: boolean }
  addDeclaration: (
    node: Node,
    isBlockDeclaration: boolean,
    isVar: boolean,
  ) => void
  contains: (name: string) => boolean
}

export type WithScope<T> = T & {
  scope?: AttachedScope
}

interface BlockDeclaration {
  [index: string]: boolean
}

const blockDeclarations: BlockDeclaration = {
  const: true,
  let: true,
}

interface ScopeOptions {
  parent?: AttachedScope
  block?: boolean
  params?: Node[]
}

class Scope implements AttachedScope {
  parent?: AttachedScope
  isBlockScope: boolean
  declarations: { [key: string]: boolean }

  constructor(options: ScopeOptions = {}) {
    this.parent = options.parent
    this.isBlockScope = !!options.block

    this.declarations = Object.create(null)

    if (options.params) {
      options.params.forEach((param) => {
        extractAssignedNames(param).forEach((name) => {
          this.declarations[name] = true
        })
      })
    }
  }

  addDeclaration(
    node: Node,
    isBlockDeclaration: boolean,
    isVar: boolean,
  ): void {
    if (!isBlockDeclaration && this.isBlockScope) {
      // it's a `var` or function node, and this
      // is a block scope, so we need to go up
      this.parent!.addDeclaration(node, isBlockDeclaration, isVar)
    } else if ((node as any).id) {
      extractAssignedNames((node as any).id).forEach((name) => {
        this.declarations[name] = true
      })
    }
  }

  contains(name: string): boolean {
    return (
      this.declarations[name] ||
      (this.parent ? this.parent.contains(name) : false)
    )
  }
}

/**
 * Attaches scopes to the given AST
 *
 * @param ast - The AST to attach scopes to.
 * @param propertyName - The name of the property to attach the scopes to. Default is 'scope'.
 * @returns The root scope of the AST.
 */
export function attachScopes(ast: Node, propertyName = 'scope'): Scope {
  let scope = new Scope()

  walkAST(ast, {
    enter(node, parent) {
      // function foo () {...}
      // class Foo {...}
      if (/(?:Function|Class)Declaration/.test(node.type)) {
        scope.addDeclaration(node, false, false)
      }

      // var foo = 1
      if (node.type === 'VariableDeclaration') {
        const { kind } = node
        const isBlockDeclaration = blockDeclarations[kind]
        node.declarations.forEach((declaration) => {
          scope.addDeclaration(declaration, isBlockDeclaration, true)
        })
      }

      let newScope: AttachedScope | undefined

      // create new function scope
      if (/Function/.test(node.type)) {
        const func = node as Function
        newScope = new Scope({
          parent: scope,
          block: false,
          params: func.params,
        })

        // named function expressions - the name is considered
        // part of the function's scope
        if (func.type === 'FunctionExpression' && func.id) {
          newScope.addDeclaration(func, false, false)
        }
      }

      // create new for scope
      if (/For(?:In|Of)?Statement/.test(node.type)) {
        newScope = new Scope({
          parent: scope,
          block: true,
        })
      }

      // create new block scope
      if (node.type === 'BlockStatement' && !/Function/.test(parent!.type)) {
        newScope = new Scope({
          parent: scope,
          block: true,
        })
      }

      // catch clause has its own block scope
      if (node.type === 'CatchClause') {
        newScope = new Scope({
          parent: scope,
          params: node.param ? [node.param] : [],
          block: true,
        })
      }

      if (newScope) {
        Object.defineProperty(node, propertyName, {
          value: newScope,
          configurable: true,
        })

        scope = newScope
      }
    },
    leave(node) {
      if ((node as Record<string, any>)[propertyName]) scope = scope.parent!
    },
  })

  return scope
}

/* c8 ignore stop */
