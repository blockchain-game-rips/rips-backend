import { ChainId } from '../value-objects/chain-id'
import { CurrencyId, tokenIdSchema } from '../value-objects/currency-id'

export function parseCurrencyId(tokenId: CurrencyId): {
	chainId: ChainId
	address: string
} {
	const tokenIdChecked = tokenIdSchema.parse(tokenId)

	const [namespace, reference, address] = tokenIdChecked.split(':')

	return { chainId: `${namespace}:${reference}`, address }
}

export function composeCurrencyId(
	chainId: ChainId,
	address: string,
): CurrencyId {
	return `${chainId}:${address}`.toLowerCase() as CurrencyId
}
