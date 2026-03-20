import { Injectable } from '@nestjs/common'
import { Address, erc20Abi } from 'viem'
import { EvmClientService } from './evm-client/evm-client.service'
import { EvmCurrency } from './primitives/currencies/evm-currency'
import { Token } from './primitives/currencies/token'

@Injectable()
export class EvmCurrencyReadService {
	constructor(private readonly evmClientService: EvmClientService) {}

	async balanceOf(currency: EvmCurrency, address: Address): Promise<bigint> {
		const chainId = Number(currency.account.chain.reference)
		const currencyAddress = currency.account.address
		const client = this.evmClientService.getClient(chainId)

		if (currency instanceof Token) {
			return client.readContract({
				address: currencyAddress,
				abi: erc20Abi,
				functionName: 'balanceOf',
				args: [address],
			})
		}

		return client.getBalance({ address })
	}

	async allowance(
		token: Token,
		owner: Address,
		spender: Address,
	): Promise<bigint> {
		const chainId = Number(token.account.chain.reference)
		const client = this.evmClientService.getClient(chainId)

		return client.readContract({
			address: token.account.address,
			abi: erc20Abi,
			functionName: 'allowance',
			args: [owner, spender],
		})
	}
}
