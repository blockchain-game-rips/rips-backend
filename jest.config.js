/** @type {import('ts-jest').JestConfigWithTsJest} **/

const sharedConfig = {
	testEnvironment: 'node',
	transform: {
		'^.+.tsx?$': ['ts-jest', {}],
	},
	moduleNameMapper: {
		'^src/(.*)$': '<rootDir>/src/$1',
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
	],
	testTimeout: 30_000,
}
