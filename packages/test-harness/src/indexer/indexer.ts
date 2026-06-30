import { DataSource } from 'typeorm'
import { deployments } from '../state'
import { IndexerPostgres } from './indexer-postgres'
import { IndexerProcessor } from './indexer-processor'

const CONTRACT_DEPLOYED_AT = '0'
const HEAD_POLL_INTERVAL_MS = '50'

const DEFAULT_WAIT_TIMEOUT_MS = 10000
const WAIT_POLL_INTERVAL_MS = 50

type HotBlockRow = { max: number | null }

export type IndexerConfig = {
	getRpcUrl: () => string
}

export class Indexer {
	private readonly postgres = new IndexerPostgres()
	private readonly processor = new IndexerProcessor()

	private dataSource: DataSource | undefined

	constructor(private readonly config: IndexerConfig) {}

	get databaseUrl(): string {
		return this.postgres.connectionUrl
	}

	async start(): Promise<void> {
		await this.postgres.start()

		await this.processor.start({
			RPC_ENDPOINT: this.config.getRpcUrl(),
			CONTRACT_ADDRESS: deployments.rips,
			CONTRACT_DEPLOYED_AT,
			DB_URL: this.postgres.connectionUrl,
			HEAD_POLL_INTERVAL_MS,
		})

		this.dataSource = new DataSource({
			type: 'postgres',
			url: this.postgres.connectionUrl,
			synchronize: false,
			migrationsRun: false,
		})

		await this.dataSource.initialize()
	}

	async stop(): Promise<void> {
		await this.dataSource?.destroy()

		this.processor.stop()

		await this.postgres.stop()
	}

	async waitForBlock(
		blockNumber: number,
		timeoutMs: number = DEFAULT_WAIT_TIMEOUT_MS,
	): Promise<void> {
		if (!this.dataSource) {
			throw new Error('Indexer not started')
		}

		const dataSource = this.dataSource

		const deadline = Date.now() + timeoutMs

		while (Date.now() < deadline) {
			const indexedHeight = await getIndexedHeight(dataSource)

			if (indexedHeight !== undefined && indexedHeight >= blockNumber) {
				return
			}

			await sleep(WAIT_POLL_INTERVAL_MS)
		}

		throw new Error(
			`Indexer did not reach block ${blockNumber} within ${timeoutMs}ms`,
		)
	}
}

async function getIndexedHeight(
	dataSource: DataSource,
): Promise<number | undefined> {
	const rows: HotBlockRow[] = await dataSource.query(
		'SELECT MAX(height) FROM squid_processor.hot_block',
	)

	const height = rows[0]?.max

	return height !== null ? height : undefined
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
