/** @type {import('ts-jest').JestConfigWithTsJest} **/

const sharedConfig = {
	testEnvironment: 'node',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {}],
		'^(?!.*/generated/).*\\.js$': ['ts-jest', { diagnostics: false }],
	},
	transformIgnorePatterns: ['node_modules/(?!(ky)/)'],
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/src/$1',
		'^generated/(.*)$': '<rootDir>/generated/$1',
		'^@rips/test-harness/state$':
			'<rootDir>/../../packages/test-harness/src/state/index.ts',
		'^@rips/test-harness$':
			'<rootDir>/../../packages/test-harness/src/index.ts',
	},
}

module.exports = {
	projects: [
		{
			...sharedConfig,
			displayName: 'unit',
			testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
		},
		{
			...sharedConfig,
			displayName: 'integration',
			testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
		},
		{
			...sharedConfig,
			displayName: 'e2e',
			testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
		},
	],
	testTimeout: 30_000,
}
