import {
	PostgreSqlContainer,
	StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { DataSource } from 'typeorm'
import path from 'path'

export class Postgres {
	private container: StartedPostgreSqlContainer | undefined

	get connectionUrl() {
		if (!this.container) throw new Error('Postgres not started')
		return this.container.getConnectionUri()
	}

	async start() {
		this.container = await new PostgreSqlContainer('postgres:16').start()

		const dataSource = new DataSource({
			type: 'postgres',
			url: this.connectionUrl,
			migrations: [path.resolve(__dirname, '../../db/migrations/*.js')],
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
