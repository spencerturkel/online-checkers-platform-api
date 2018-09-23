module.exports = {
  moduleFileExtensions: ['js', 'ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
	  'ts-jest': { tsConfig: 'tsconfig.json' }
  },
	transform: {
		'^.+\\.ts$': 'ts-jest'
	},
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.spec.ts']
};
