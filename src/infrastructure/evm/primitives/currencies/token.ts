import { Address, isAddress, isAddressEqual } from 'viem'
import { CurrencyMetadata } from '../../../../domain/entities/currency'
import { NATIVE_ADDRESS } from './constants'
import { EvmCurrency } from './evm-currency'

export class Token extends EvmCurrency {
	constructor(address: Address, chainId: number, metadata: CurrencyMetadata) {
		Token.validateAddress(address, metadata.symbol)
		Token.validateDecimals(metadata.decimals, metadata.symbol)
		super(address, chainId, metadata)
	}

	private static validateAddress(address: Address, symbol: string): void {
		if (!isAddress(address)) {
			throw new Error(`Invalid address for token ${symbol}`)
		}

		if (isAddressEqual(address, NATIVE_ADDRESS)) {
			throw new Error(
				`Cannot make a token from native currency ${symbol}`,
			)
		}
	}

	private static validateDecimals(decimals: number, symbol: string): void {
		if (decimals < 0 || decimals > 18) {
			throw new Error(
				`Invalid decimals (${decimals}) for token ${symbol}, must be between 0 and 18`,
			)
		}
	}
}
