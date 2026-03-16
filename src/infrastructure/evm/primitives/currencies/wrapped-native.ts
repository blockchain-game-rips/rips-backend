import { CurrencyMetadata } from 'src/domain/entities/currency'
import { EvmClientService } from '../../evm-client/evm-client.service'
import { WRAPPED_TOKENS } from './constants'
import { NativeCurrency } from './native-currency'
import { Token } from './token'

export class WrappedNative extends Token {
	constructor(
		evmClientService: EvmClientService,
		readonly native: NativeCurrency,
		chainId: number,
		currencyMetadata: CurrencyMetadata,
	) {
		const address = WRAPPED_TOKENS[chainId]

		if (!address) {
			throw new Error(`Wrapped token not found for chain ${chainId}`)
		}

		super(evmClientService, address, chainId, currencyMetadata)
	}

	// async deposit(amount: bigint) {
	// 	const balance = await this.native.balanceOf(this.wallet.account.address)
	//
	// 	if (balance < amount) {
	// 		throw new WrappedNativeError('Insufficient balance')
	// 	}
	//
	// 	const hash = await this.wallet.writeContract({
	// 		address: this.address,
	// 		abi: WETH_ABI,
	// 		functionName: 'deposit',
	// 		account: this.wallet.account,
	// 		chain: this.wallet.chain,
	// 		value: amount,
	// 	})
	//
	// 	return hash
	// }
	//
	// async withdraw(amount: bigint) {
	// 	const balance = await this.balanceOf(this.wallet.account.address)
	//
	// 	if (balance < amount) {
	// 		throw new WrappedNativeError('Insufficient balance')
	// 	}
	//
	// 	const hash = await this.wallet.writeContract({
	// 		address: this.address,
	// 		abi: WETH_ABI,
	// 		functionName: 'withdraw',
	// 		account: this.wallet.account,
	// 		chain: this.wallet.chain,
	// 		args: [amount],
	// 	})
	//
	// 	return hash
	// }
}
