import { Hash, PublicClient } from 'viem'

export async function waitForReceipt(client: PublicClient, hash: Hash) {
	const receipt = await client.waitForTransactionReceipt({
		hash,
	})

	if (receipt.status === 'reverted') {
		console.log('tx reverted, receipt:', receipt)
		throw new Error('Tx reverted')
	}
}
