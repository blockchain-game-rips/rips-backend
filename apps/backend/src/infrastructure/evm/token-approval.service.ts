import { Injectable } from '@nestjs/common'
import { Address, maxUint256 } from 'viem'
import { Currency } from '../../domain/entities/currency'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmCurrencyReadService } from './evm-currency-read.service'
import { EvmCurrencyWriteService } from './evm-currency-write.service'
import { Token } from './primitives/currencies/token'

@Injectable()
export class TokenApprovalService {
	constructor(
		private readonly evmCurrencyReadService: EvmCurrencyReadService,
		private readonly evmCurrencyWriteService: EvmCurrencyWriteService,
	) {}

	async approveIfNeeded(args: {
		wallet: Wallet
		currency: Currency
		amount: bigint
		spender: Address
		owner: Address
	}): Promise<void> {
		const { wallet, currency, amount, spender, owner } = args

		if (!(currency instanceof Token)) return

		const allowance = await this.evmCurrencyReadService.allowance(
			currency,
			owner,
			spender,
		)

		if (allowance >= amount) return

		await this.evmCurrencyWriteService.approve(wallet, {
			token: currency,
			spender,
			amount: maxUint256,
		})
	}
}
