import { CurrencyMetadata } from '../../../../domain/entities/currency'
import { NATIVE_ADDRESS } from './constants'
import { EvmCurrency } from './evm-currency'

export class NativeCurrency extends EvmCurrency {
	constructor(chainId: number, metadata: CurrencyMetadata) {
		super(NATIVE_ADDRESS, chainId, metadata)
	}
}
