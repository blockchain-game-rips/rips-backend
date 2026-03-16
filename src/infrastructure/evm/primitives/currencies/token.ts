import { CurrencyMetadata } from 'src/domain/entities/currency'
import { Address, erc20Abi, isAddress, isAddressEqual } from 'viem'
import { EvmClientService } from '../../evm-client/evm-client.service'
import { EvmCurrency } from './currency'
import { NATIVE_ADDRESS } from './native-currency'

export class Token extends EvmCurrency {
	constructor(
		evmClientService: EvmClientService,
		address: Address,
		chainId: number,
		currencyMetadata: CurrencyMetadata,
	) {
		super(evmClientService, address, chainId, currencyMetadata)
		this.validateTokenAddress(address)
		this.validateDecimals(currencyMetadata.decimals)
	}

	isNative(): false {
		return false
	}

	private validateTokenAddress(address: Address): void {
		if (!isAddress(address)) {
			throw new Error(`Invalid address for token ${this.symbol}`)
		}

		if (isAddressEqual(address, NATIVE_ADDRESS)) {
			throw new Error(
				`Cannot make a token from native currency ${this.symbol}`,
			)
		}
	}

	private validateDecimals(decimals: number): void {
		if (decimals < 0 || decimals > 18) {
			throw new Error(
				`Invalid token decimals (${decimals}), must be between 0 and 18`,
			)
		}
	}

	async balanceOf(address: Address, blockNumber?: bigint): Promise<bigint> {
		const balance = await this.client.readContract({
			address: this.address,
			abi: erc20Abi,
			functionName: 'balanceOf',
			args: [address],
			blockNumber,
		})
		return balance
	}

	async allowance(address: Address, spender: Address): Promise<bigint> {
		const allowance = await this.client.readContract({
			address: this.address,
			abi: erc20Abi,
			functionName: 'allowance',
			args: [address, spender],
		})
		return allowance
	}
}
