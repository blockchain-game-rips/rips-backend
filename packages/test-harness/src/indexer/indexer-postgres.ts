import {
	PostgreSqlContainer,
	StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { DataSource } from 'typeorm'
import { INDEXER_MIGRATIONS_GLOB } from './indexer-paths'

const POSTGRES_IMAGE = 'postgres:16'

export class IndexerPostgres {
	private container: StartedPostgreSqlContainer | undefined

	get connectionUrl() {
		if (!this.container) {
			throw new Error('Indexer Postgres not started')
		}

		return this.container.getConnectionUri()
	}

	async start() {
		this.container = await new PostgreSqlContainer(POSTGRES_IMAGE).start()

		const dataSource = new DataSource({
			type: 'postgres',
			url: this.connectionUrl,
			migrations: [INDEXER_MIGRATIONS_GLOB],
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
