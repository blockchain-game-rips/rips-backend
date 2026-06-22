import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { execFileSync } from 'child_process'
import { rmSync } from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const MIGRATIONS_DIR = path.resolve(PROJECT_ROOT, 'db/migrations')

async function generateMigrations() {
	const container = await new PostgreSqlContainer('postgres:16').start()

	const dbEnv = {
		...process.env,
		DB_HOST: container.getHost(),
		DB_PORT: String(container.getPort()),
		DB_NAME: container.getDatabase(),
		DB_USER: container.getUsername(),
		DB_PASS: container.getPassword(),
	}

	const run = (command: string, args: string[]) =>
		execFileSync(command, args, {
			cwd: PROJECT_ROOT,
			env: dbEnv,
			stdio: 'inherit',
		})

	try {
		run('yarn', ['squid-typeorm-codegen'])

		rmSync(MIGRATIONS_DIR, { recursive: true, force: true })

		run('yarn', ['build'])

		run('yarn', ['squid-typeorm-migration-generate'])
	} finally {
		await container.stop()
	}
}

generateMigrations().catch((error) => {
	console.error(error)
	process.exit(1)
})
