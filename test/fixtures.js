export const DOMAIN_OBJECT = { // eslint-disable-line import/prefer-default-export
  f1: 'v1', // simple field
  f2: 'v2',
  f3: { // embedded object
    f4: 'v4',
    f5: 'v5',
  },
  f6: [ // collection of objects
    {
      f7: 'v7',
      f8: 'v8',
      f9: {
        f10: 'v10',
        f11: 'v11',
      },
      f12: [ // nth level
        {
          f13: 'v13',
          f14: 'v14',
          f15: {
            f16: 'v16',
            f17: 'v17',
            f1: 18,
          },
        },
      ],
    },
  ],
};
