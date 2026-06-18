import {
	PostgreSqlContainer,
	StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { execSync } from 'child_process'

export class Postgres {
	private container: StartedPostgreSqlContainer | undefined

	get databaseUrl() {
		if (!this.container) {
			throw new Error('Postgres not started')
		}

		return this.container.getConnectionUri()
	}

	async start() {
		this.container = await new PostgreSqlContainer('postgres:16').start()

		execSync('yarn prisma db push --force-reset', {
			stdio: 'inherit',
			env: {
				...process.env,
				DATABASE_URL: this.databaseUrl,
				PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
			},
		})
	}

	async stop() {
		await this.container?.stop()
	}
}

export function usePostgres() {
	const postgres = new Postgres()

	beforeAll(async () => {
		await postgres.start()
		process.env.DATABASE_URL = postgres.databaseUrl
	})

	afterAll(async () => {
		await postgres.stop()
	})

	return { postgres }
}
