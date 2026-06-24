import { DataSource } from 'typeorm'
import { deployments } from '../state'
import { IndexerPostgres } from './indexer-postgres'
import { IndexerProcessor } from './indexer-processor'

const CONTRACT_DEPLOYED_AT = '0'
const HEAD_POLL_INTERVAL_MS = '50'

const DEFAULT_WAIT_TIMEOUT_MS = 10000
const WAIT_POLL_INTERVAL_MS = 50

type HotBlockRow = { max: number | null }

export type Indexer = {
	databaseUrl: string
	waitForBlock: (blockNumber: number, timeoutMs?: number) => Promise<void>
}

export function useIndexer(getRpcUrl: () => string): Indexer {
	const postgres = new IndexerPostgres()
	const processor = new IndexerProcessor()

	let dataSource: DataSource | undefined

	const result: Indexer = {
		databaseUrl: '',
		waitForBlock: (blockNumber, timeoutMs = DEFAULT_WAIT_TIMEOUT_MS) => {
			if (!dataSource) {
				throw new Error('Indexer not started')
			}

			return waitForBlock(dataSource, blockNumber, timeoutMs)
		},
	}

	beforeAll(async () => {
		await postgres.start()

		result.databaseUrl = postgres.connectionUrl

		await processor.start({
			RPC_ENDPOINT: getRpcUrl(),
			CONTRACT_ADDRESS: deployments.rips,
			CONTRACT_DEPLOYED_AT,
			DB_URL: postgres.connectionUrl,
			HEAD_POLL_INTERVAL_MS,
		})

		dataSource = new DataSource({
			type: 'postgres',
			url: postgres.connectionUrl,
			synchronize: false,
			migrationsRun: false,
		})

		await dataSource.initialize()
	})

	afterAll(async () => {
		await dataSource?.destroy()

		processor.stop()

		await postgres.stop()
	})

	return result
}

async function waitForBlock(
	dataSource: DataSource,
	blockNumber: number,
	timeoutMs: number,
): Promise<void> {
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
