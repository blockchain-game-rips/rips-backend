import { resolve } from 'node:path'

const TEST_TIMEOUT_MS = 30_000

// Setup hooks start testcontainers, which pull their image on a cold cache.
const HOOK_TIMEOUT_MS = 120_000

const repoRoot = import.meta.dirname
const harnessRoot = resolve(repoRoot, 'packages/test-harness/src')

// Vitest 4 projects do not inherit `resolve` from the root config, so every
// project gets its own copy of these aliases.
const aliasesFor = (appRoot: string) => [
	{
		find: '@rips/test-harness/state',
		replacement: resolve(harnessRoot, 'state/index.ts'),
	},
	{
		find: '@rips/test-harness',
		replacement: resolve(harnessRoot, 'index.ts'),
	},
	{ find: /^src\//, replacement: `${appRoot}/src/` },
	{ find: /^generated\//, replacement: `${appRoot}/generated/` },
	{ find: /^test\//, replacement: `${appRoot}/test/` },
]

export const projectFactory = (appRoot: string) => {
	const alias = aliasesFor(appRoot)

	return (name: string) => ({
		resolve: { alias },
		test: {
			name,
			globals: true,
			environment: 'node' as const,
			testTimeout: TEST_TIMEOUT_MS,
			hookTimeout: HOOK_TIMEOUT_MS,
			include: [`test/${name}/**/*.spec.ts`],
		},
	})
}
