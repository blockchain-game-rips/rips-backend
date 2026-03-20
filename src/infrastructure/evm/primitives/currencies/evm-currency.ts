import { EIP155 } from 'src/constants'
import { Currency, CurrencyMetadata } from 'src/domain/entities/currency'
import { composeChainId } from 'src/domain/services/chain-id-utils'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { Chain } from 'src/domain/value-objects/chain'
import { CurrencyId } from 'src/domain/value-objects/currency-id'
import { Address, getAddress } from 'viem'

export abstract class EvmCurrency implements Currency {
	readonly id: CurrencyId
	readonly account: {
		chain: Chain
		address: Address
	}
	readonly symbol: string
	readonly decimals: number
	readonly name?: string

	constructor(address: Address, chainId: number, metadata: CurrencyMetadata) {
		const checksumAddress = getAddress(address)

		const chain = { namespace: EIP155, reference: chainId.toString() }
		this.account = { chain, address: checksumAddress }

		const caip2ChainId = composeChainId(EIP155, chainId.toString())
		this.id = composeCurrencyId(caip2ChainId, checksumAddress)

		this.symbol = metadata.symbol
		this.decimals = metadata.decimals
		this.name = metadata.name
	}
}
