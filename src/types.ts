/**
 * A type that represents a literal union.
 */
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
