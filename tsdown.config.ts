import { lib } from 'tsdown-preset-sxzz'

export default lib(
  {},
  {
    deps: {
      dts: {
        neverBundle: ['@babel/types'],
      },
    },
  },
)
