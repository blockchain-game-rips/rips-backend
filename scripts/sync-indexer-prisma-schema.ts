import { execFileSync } from 'child_process'
import path from 'path'

import { Postgres } from '../apps/indexer/test/utils/postgres'

const REPO_ROOT = path.resolve(__dirname, '..')
const INDEXER_CONFIG = 'prisma.indexer.config.ts'

function runInBackend(args: string[], env: NodeJS.ProcessEnv) {
	execFileSync('yarn', ['workspace', 'backend', ...args], {
		cwd: REPO_ROOT,
		env,
		stdio: 'inherit',
	})
}

async function syncIndexerPrismaSchema() {
	const postgres = new Postgres()

	await postgres.start()

	try {
		const env = {
			...process.env,
			INDEXER_DATABASE_URL: postgres.connectionUrl,
		}

		runInBackend(['prisma', 'db', 'pull', '--config', INDEXER_CONFIG], env)

		runInBackend(['prisma', 'generate', '--config', INDEXER_CONFIG], env)
	} finally {
		await postgres.stop()
	}
}

syncIndexerPrismaSchema().catch((error) => {
	console.error(error)
	process.exit(1)
})
