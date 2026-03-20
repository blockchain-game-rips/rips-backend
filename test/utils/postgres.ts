import {
	PostgreSqlContainer,
	StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { createOrmConfig } from '@subsquid/typeorm-config'
import { DataSource } from 'typeorm'

export class Postgres {
	private container: StartedPostgreSqlContainer | undefined

	get connectionUrl() {
		if (!this.container) throw new Error('Postgres not started')
		return this.container.getConnectionUri()
	}

	async start() {
		this.container = await new PostgreSqlContainer('postgres:16').start()

		process.env.DB_URL = this.connectionUrl

		const dataSource = new DataSource({
			...createOrmConfig(),
			subscribers: [],
			synchronize: false,
			migrationsRun: false,
			dropSchema: false,
		})

		await dataSource.initialize()
		try {
			await dataSource.runMigrations({ transaction: 'all' })
		} finally {
			await dataSource.destroy()
		}
	}

	async stop() {
		await this.container?.stop()
	}
}

export function usePostgres() {
	const postgres = new Postgres()

	beforeAll(async () => {
		await postgres.start()
	})

	afterAll(async () => {
		await postgres.stop()
	})

	return { postgres }
}
