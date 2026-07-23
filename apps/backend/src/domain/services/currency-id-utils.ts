import { ChainId } from '../value-objects/chain-id'
import { toChainNamespace } from '../value-objects/chain-namespace'
import { CurrencyId, currencyIdSchema } from '../value-objects/currency-id'

export function parseCurrencyId(currencyId: CurrencyId): {
	chainId: ChainId
	address: string
} {
	const currencyIdChecked = currencyIdSchema.parse(currencyId)

	const [namespace, reference, address] = currencyIdChecked.split(':')

	return { chainId: `${toChainNamespace(namespace)}:${reference}`, address }
}

export function composeCurrencyId(
	chainId: ChainId,
	address: string,
): CurrencyId {
	return `${chainId}:${address}`
}
