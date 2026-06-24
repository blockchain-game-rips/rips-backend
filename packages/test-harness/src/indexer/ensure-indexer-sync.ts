import { createPublicClient, http } from 'viem'
import { Anvil } from '../anvil'
import { Indexer } from './use-indexer'

export async function ensureIndexerSync(
	indexer: Indexer,
	anvil: Anvil,
	timeoutMs?: number,
): Promise<void> {
	const head = await getAnvilHead(anvil)

	await indexer.waitForBlock(head, timeoutMs)
}

async function getAnvilHead(anvil: Anvil): Promise<number> {
	const client = createPublicClient({
		transport: http(`http://127.0.0.1:${anvil.port}`),
	})

	const head = await client.getBlockNumber()

	return Number(head)
}
