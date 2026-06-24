import { deployments } from '../state'
import { IndexerPostgres } from './indexer-postgres'
import { IndexerProcessor } from './indexer-processor'

const CONTRACT_DEPLOYED_AT = '0'
const HEAD_POLL_INTERVAL_MS = '50'

export type Indexer = {
	databaseUrl: string
}

export function useIndexer(getRpcUrl: () => string): Indexer {
	const postgres = new IndexerPostgres()
	const processor = new IndexerProcessor()

	const result: Indexer = { databaseUrl: '' }

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
	})

	afterAll(async () => {
		processor.stop()

		await postgres.stop()
	})

	return result
}
