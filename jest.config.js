/** @type {import('ts-jest').JestConfigWithTsJest} **/

const sharedConfig = {
	testEnvironment: 'node',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	transform: {
		'^.+.tsx?$': ['ts-jest', {}],
	},
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/src/$1',
		'^generated/(.*)$': '<rootDir>/generated/$1',
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
