import fs from 'fs'
import path from 'path'

const WORKSPACE_MARKER = 'yarn.lock'

function findWorkspaceRoot(startDir: string): string {
	let current = startDir

	while (true) {
		if (fs.existsSync(path.join(current, WORKSPACE_MARKER))) {
			return current
		}

		const parent = path.dirname(current)

		if (parent === current) {
			throw new Error(
				`Could not locate workspace root (no ${WORKSPACE_MARKER} found above ${startDir})`,
			)
		}

		current = parent
	}
}

const WORKSPACE_ROOT = findWorkspaceRoot(__dirname)

export const INDEXER_ROOT = path.join(WORKSPACE_ROOT, 'apps/indexer')

export const INDEXER_PROCESSOR_MAIN = path.join(INDEXER_ROOT, 'lib/main.js')

export const INDEXER_MIGRATIONS_GLOB = path.join(
	INDEXER_ROOT,
	'db/migrations/*.js',
)
