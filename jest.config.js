module.exports = {
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    __TEST__: true,
    'ts-jest': { tsConfig: 'tsconfig.json' },
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.spec.ts'],
};
