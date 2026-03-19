import { Currency } from '../entities/currency'
import { ChainAddress } from '../value-objects/chain-address'
import { Wallet } from '../value-objects/wallet'

export function resolveChainAddress(
	wallet: Wallet,
	currency: Currency,
): ChainAddress {
	const { namespace } = currency.account.chain
	const address = wallet.namespaceToAddress[namespace]

	if (!address) {
		throw new Error(`Wallet has no address for namespace: ${namespace}`)
	}

	return {
		chain: currency.account.chain,
		address,
	}
}
