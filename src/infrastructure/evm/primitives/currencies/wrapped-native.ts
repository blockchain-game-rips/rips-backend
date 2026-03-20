import { CurrencyMetadata } from 'src/domain/entities/currency'
import { WRAPPED_TOKENS } from './constants'
import { NativeCurrency } from './native-currency'
import { Token } from './token'

export class WrappedNative extends Token {
	readonly native: NativeCurrency

	constructor(
		chainId: number,
		native: NativeCurrency,
		metadata: CurrencyMetadata,
	) {
		const address = WRAPPED_TOKENS[chainId]

		if (!address) {
			throw new Error(`Wrapped token not found for chain ${chainId}`)
		}

		super(address, chainId, metadata)
		this.native = native
	}
}
