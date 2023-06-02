import {
  type AttachedScope,
  attachScopes as _attachScopes,
} from '@rollup/pluginutils'

const attachScopes = _attachScopes as <T>(
  ast: T,
  propertyName?: string
) => AttachedScope
export { type AttachedScope, attachScopes }

export type WithScope<T> = T & {
  scope?: AttachedScope
}
