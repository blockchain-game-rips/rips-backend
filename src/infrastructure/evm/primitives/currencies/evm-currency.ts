import { Address, getAddress } from 'viem'
import { EIP155 } from '../../../../constants'
import {
	Currency,
	CurrencyMetadata,
} from '../../../../domain/entities/currency'
import { composeChainId } from '../../../../domain/services/chain-id-utils'
import { composeCurrencyId } from '../../../../domain/services/currency-id-utils'
import { Chain } from '../../../../domain/value-objects/chain'
import { CurrencyId } from '../../../../domain/value-objects/currency-id'

export abstract class EvmCurrency implements Currency {
	readonly id: CurrencyId
	readonly chainAddress: {
		chain: Chain
		address: Address
	}
	readonly symbol: string
	readonly decimals: number
	readonly name: string

	constructor(address: Address, chainId: number, metadata: CurrencyMetadata) {
		const checksumAddress = getAddress(address)

		const chain = { namespace: EIP155, reference: chainId.toString() }
		this.chainAddress = { chain, address: checksumAddress }

		const caip2ChainId = composeChainId(EIP155, chainId.toString())
		this.id = composeCurrencyId(caip2ChainId, checksumAddress)

		this.symbol = metadata.symbol
		this.decimals = metadata.decimals
		this.name = metadata.name
	}
}
