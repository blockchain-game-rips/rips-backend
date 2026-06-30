import { Indexer } from './indexer'

export function useIndexer(getRpcUrl: () => string): Indexer {
	const indexer = new Indexer({ getRpcUrl })

	beforeAll(async () => {
		await indexer.start()
	})

	afterAll(async () => {
		await indexer.stop()
	})

	return indexer
}
