import type * as t from '@babel/types'

export type LiteralUnion<
  LiteralType,
  BaseType extends
    | null
    | undefined
    | string
    | number
    | boolean
    | symbol
    | bigint = string,
> = LiteralType | (BaseType & Record<never, never>)

/**
 * @see https://github.com/babel/babel/blob/d7f8401f14779d5615c3ae5d669afcb76dc30432/packages/babel-types/src/validators/generated/index.ts#L12
 */
export type Opts<Obj> = Partial<{
  [Prop in keyof Obj]: Obj[Prop] extends t.Node
    ? t.Node
    : Obj[Prop] extends t.Node[]
      ? t.Node[]
      : Obj[Prop]
}>
