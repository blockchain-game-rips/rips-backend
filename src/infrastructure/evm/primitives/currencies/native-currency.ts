import { CurrencyMetadata } from 'src/domain/entities/currency'
import { Address } from 'viem'
import { EvmClientService } from '../../evm-client/evm-client.service'
import { EvmCurrency } from './currency'

export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

export class NativeCurrency extends EvmCurrency {
	constructor(
		evmClientService: EvmClientService,
		chainId: number,
		currencyMetadata: CurrencyMetadata,
	) {
		super(evmClientService, NATIVE_ADDRESS, chainId, currencyMetadata)
	}

	isNative(): true {
		return true
	}

	async balanceOf(address: Address, blockNumber?: bigint): Promise<bigint> {
		return await this.client.getBalance({
			address,
			blockNumber,
		})
	}
}
