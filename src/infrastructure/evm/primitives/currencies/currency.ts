import { Currency, CurrencyMetadata } from 'src/domain/entities/currency'
import { composeChainId } from 'src/domain/services/chain-id-utils'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { CurrencyId } from 'src/domain/value-objects/currency-id'
import { Address } from 'viem'
import { EvmClientService } from '../../evm-client/evm-client.service'
import { BaseContract } from '../contracts/BaseContract'

const NAMESPACE = 'eip155'

export abstract class EvmCurrency extends BaseContract implements Currency {
	public readonly symbol: string
	public readonly decimals: number
	public readonly name?: string

	id: CurrencyId

	constructor(
		evmClientService: EvmClientService,
		address: Address,
		chainId: number,
		currencyMetadata: CurrencyMetadata,
	) {
		super(evmClientService, address, chainId)

		this.symbol = currencyMetadata.symbol
		this.decimals = currencyMetadata.decimals
		this.name = currencyMetadata.name

		const caip2ChainId = composeChainId(NAMESPACE, chainId.toString())
		this.id = composeCurrencyId(caip2ChainId, address)
	}

	abstract isNative(): boolean

	abstract balanceOf(address: Address, blockNumber?: bigint): Promise<bigint>
}
