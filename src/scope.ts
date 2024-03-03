import {
  type AttachedScope,
  attachScopes as _attachScopes,
} from '@rollup/pluginutils'

const attachScopes: <T>(ast: T, propertyName?: string) => AttachedScope =
  _attachScopes as any
export { type AttachedScope, attachScopes }

export type WithScope<T> = T & {
  scope?: AttachedScope
}
